import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { DatosFidelización } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class VisitasPorHoraPorUsuarioChart extends LitElement {
  static styles = css`
    canvas {
      width: 100%;
      height: 400px;
    }
    select,
    input {
      margin: 10px;
      padding: 5px;
      font-size: 1em;
    }
  `;

  static properties = {
    datos: { type: Array },
    filtro: { type: String },
    seleccionMes: { type: String },
    seleccionAno: { type: String },
  };

  constructor() {
    super();
    this.datos = [];
    this.filtro = "mes"; // Valor predeterminado
    this.seleccionMes = "";
    this.seleccionAno = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchDataFromFirebase();
  }

  async fetchDataFromFirebase() {
    try {
      const querySnapshot = await getDocs(collection(db, "DatosFidelizacion"));
      const datosFidelizacion = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        Object.keys(data).forEach((parentKey) => {
          const parentItem = data[parentKey];

          Object.keys(parentItem).forEach((id) => {
            const item = parentItem[id];

            const fechaInicio =
              item.fecha_inicio && item.fecha_inicio.toDate
                ? item.fecha_inicio.toDate()
                : null;

            if (fechaInicio) {
              datosFidelizacion.push({
                usuario: parentKey,
                fecha_inicio: fechaInicio,
              });
            }
          });
        });
      });

      this.datos = datosFidelizacion;
      this.updateChart();
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    }
  }

  applyFilter() {
    let startDate, endDate;

    if (this.filtro === "mes" && this.seleccionMes) {
      const [year, month] = this.seleccionMes.split("-");
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else if (this.filtro === "año" && this.seleccionAno) {
      const year = parseInt(this.seleccionAno, 10);
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      startDate = new Date(0);
      endDate = new Date();
    }

    return this.datos.filter((d) => {
      const fecha = d.fecha_inicio;
      return fecha >= startDate && fecha <= endDate;
    });
  }

  calculateVisitsByUser(visitas) {
    const usuarios = {};

    visitas.forEach((visita) => {
      const { usuario, fecha_inicio } = visita;
      const hora = fecha_inicio.getHours();
      if (!usuarios[usuario]) {
        usuarios[usuario] = { mañana: 0, tarde: 0, noche: 0, total: 0 };
      }

      if (hora >= 6 && hora < 12) {
        usuarios[usuario].mañana++;
      } else if (hora >= 12 && hora < 17) {
        usuarios[usuario].tarde++;
      } else {
        usuarios[usuario].noche++;
      }

      usuarios[usuario].total++;
    });

    Object.keys(usuarios).forEach((usuario) => {
      const total = usuarios[usuario].total;
      usuarios[usuario].mañana = ((usuarios[usuario].mañana / total) * 100).toFixed(2);
      usuarios[usuario].tarde = ((usuarios[usuario].tarde / total) * 100).toFixed(2);
      usuarios[usuario].noche = ((usuarios[usuario].noche / total) * 100).toFixed(2);
    });

    return usuarios;
  }

  updateChart() {
    const ctx = this.shadowRoot.querySelector("canvas").getContext("2d");
    const filteredData = this.applyFilter();
    const visitasPorUsuario = this.calculateVisitsByUser(filteredData);

    const labels = Object.keys(visitasPorUsuario); // Usuarios
    const dataMañana = labels.map((usuario) => visitasPorUsuario[usuario].mañana);
    const dataTarde = labels.map((usuario) => visitasPorUsuario[usuario].tarde);
    const dataNoche = labels.map((usuario) => visitasPorUsuario[usuario].noche);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Mañana (%)",
            data: dataMañana,
            backgroundColor: "#FF6384",
          },
          {
            label: "Tarde (%)",
            data: dataTarde,
            backgroundColor: "#36A2EB",
          },
          {
            label: "Noche (%)",
            data: dataNoche,
            backgroundColor: "#FFCE56",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            beginAtZero: true,
            stacked: true,
          },
        },
      },
    });
  }

  handleFilterChange(event) {
    this.filtro = event.target.value;
    this.updateChart();
  }

  handleDateChange(event) {
    const value = event.target.value;

    if (this.filtro === "mes") {
      this.seleccionMes = value;
    } else if (this.filtro === "año") {
      this.seleccionAno = value;
    }

    this.updateChart();
  }

  render() {
    return html`
      <h3>Gráfico de Visitas por Hora y Usuario</h3>
      <select @change="${this.handleFilterChange}">
        <option value="mes" selected>Mes</option>
        <option value="año">Año</option>
      </select>

      ${this.filtro === "mes"
        ? html`<input
            type="month"
            @change="${this.handleDateChange}"
            value="${this.seleccionMes ||
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}"
          />`
        : ""}
      ${this.filtro === "año"
        ? html`<input
            type="number"
            min="2000"
            max="2100"
            @change="${this.handleDateChange}"
            value="${this.seleccionAno || new Date().getFullYear()}"
          />`
        : ""}

      <canvas></canvas>
    `;
  }
}

customElements.define("visitas-por-hora-por-usuario-chart", VisitasPorHoraPorUsuarioChart);

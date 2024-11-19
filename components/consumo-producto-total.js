import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Producto, DatosFidelización, Pago } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class FirebaseDataChart extends LitElement {
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
    seleccionDia: { type: String },
    seleccionMes: { type: String },
    seleccionAno: { type: String },
  };

  constructor() {
    super();
    this.datos = [];
    this.filtro = "mes"; // Valor predeterminado
    this.seleccionDia = "";
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

            const fechaFin =
              item.fecha_fin && item.fecha_fin.toDate
                ? item.fecha_fin.toDate()
                : "Fecha no disponible";
            const fechaInicio =
              item.fecha_inicio && item.fecha_inicio.toDate
                ? item.fecha_inicio.toDate()
                : "Fecha no disponible";

            const pagos = item.pago
              ? Object.values(item.pago).map(
                (p) =>
                  new Pago(
                    p?.propina || 0,
                    p?.tipo || "desconocido",
                    p?.total || 0
                  )
              )
              : [];

            const productos = item.producto
              ? Object.values(item.producto).map(
                (pr) =>
                  new Producto(
                    parseInt(pr?.cantidad) || 0,
                    pr?.idproducto || "desconocido",
                    parseInt(pr?.precio) || 0,
                    pr?.producto || "desconocido"
                  )
              )
              : [];

            datosFidelizacion.push(
              new DatosFidelización(fechaFin, fechaInicio, pagos, productos)
            );
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

    if (this.filtro === "dia" && this.seleccionDia) {
      // Fecha exacta para el día seleccionado
      const selectedDate = new Date(this.seleccionDia);
      startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      endDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      endDate.setHours(23, 59, 59, 999); // Final del día
    } else if (this.filtro === "mes" && this.seleccionMes) {
      const [year, month] = this.seleccionMes.split("-");
      startDate = new Date(year, month - 1, 1); // Inicio del mes
      endDate = new Date(year, month, 0); // Fin del mes
      endDate.setHours(23, 59, 59, 999);
    } else if (this.filtro === "año" && this.seleccionAno) {
      const year = parseInt(this.seleccionAno, 10);
      startDate = new Date(year, 0, 1); // Inicio del año
      endDate = new Date(year, 11, 31); // Fin del año
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Sin filtro, usar todas las fechas
      startDate = new Date(0); // Desde el inicio del tiempo
      endDate = new Date(); // Hasta ahora
      endDate.setHours(23, 59, 59, 999); // Asegurarse de incluir el final del día actual
    }

    // Filtrar los datos únicamente por fecha_inicio
    return this.datos.filter((d) => {
      if (d.fecha_inicio && d.fecha_inicio instanceof Date) {
        return d.fecha_inicio >= startDate && d.fecha_inicio <= endDate;
      }
      return false; // Excluir datos sin fecha válida
    });
  }

  handleFilterChange(event) {
    this.filtro = event.target.value;
    this.updateChart();
  }

  handleDateChange(event) {
    const value = event.target.value;

    if (this.filtro === "dia") {
      this.seleccionDia = value || new Date().toISOString().split("T")[0]; // Día actual predeterminado
    } else if (this.filtro === "mes") {
      this.seleccionMes = value || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    } else if (this.filtro === "año") {
      this.seleccionAno = value || `${new Date().getFullYear()}`;
    }

    this.updateChart(); // Forzar la actualización del gráfico
  }


  updateChart() {
    const ctx = this.shadowRoot.getElementById("chart").getContext("2d");

    // Aplicar filtro a los datos
    const filteredData = this.applyFilter();

    const labels = [];
    const data = [];
    const colors = [];

    const generateColor = () =>
      `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255
      )}, 0.6)`;

    this.datos.forEach((dato) => {
      dato.producto.forEach((producto) => {
        const index = labels.indexOf(producto.producto);
        const total = filteredData.includes(dato)
          ? parseInt(producto.cantidad) * parseInt(producto.precio)
          : 0;

        if (index !== -1) {
          data[index] += total;
        } else {
          labels.push(producto.producto);
          data.push(total);
          colors.push(generateColor());
        }
      });
    });

    const totalConsumo = data.reduce((acc, curr) => acc + curr, 0);

    const totalText = this.shadowRoot.getElementById("total-text");
    if (totalText) {
      totalText.textContent = `Consumo total acumulado: $${totalConsumo}`;
    }

    // Si ya existe un gráfico, destrúyelo antes de crear uno nuevo
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Crear un nuevo gráfico
    this.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Consumo Total de Productos",
            data,
            backgroundColor: colors,
            borderColor: colors.map((color) =>
              color.replace("0.6", "1")
            ),
            borderWidth: 1,
            barThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }


  render() {
    return html`
     <h3>Gráfico de consumo de producto total </h3>
      <select @change="${this.handleFilterChange}">
        <option value="dia">Día</option>
        <option value="mes" selected>Mes</option>
        <option value="año">Año</option>
      </select>
  
      <!-- Inputs dinámicos -->
      ${this.filtro === "dia"
        ? html`<input
            type="date"
            value="${this.seleccionDia || new Date().toISOString().split("T")[0]}"
            @change="${this.handleDateChange}"
          />`
        : ""}
      ${this.filtro === "mes"
        ? html`<input
            type="month"
            value="${this.seleccionMes || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}"
            @change="${this.handleDateChange}"
          />`
        : ""}
      ${this.filtro === "año"
        ? html`<input
            type="number"
            min="2000"
            max="2100"
            placeholder="Año"
            value="${this.seleccionAno || `${new Date().getFullYear()}`}"
            @change="${this.handleDateChange}"
          />`
        : ""}
  
      <canvas id="chart"></canvas>
      <p
        id="total-text"
        style="text-align: center; font-size: 1.2em; font-weight: bold; margin-top: 1em;"
      >
        <!-- Aquí se renderizará el texto dinámicamente -->
      </p>
    `;
  }

}

customElements.define("firebase-data-chart", FirebaseDataChart);

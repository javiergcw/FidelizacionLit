import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class VisitasPorHoraPorUsuarioChart extends LitElement {
  static styles = css`
.chart-container {
  display: flex; /* Usa flexbox para alinear las gráficas horizontalmente */
  justify-content: flex-start; /* Alineación de los elementos al inicio del contenedor */
  gap: 20px; /* Espaciado entre las gráficas */
  overflow-x: auto; /* Permite desplazamiento horizontal si no cabe en pantalla */
  padding: 10px;
  box-sizing: border-box;
  scroll-behavior: smooth;
}

.chart-item {
  flex: 0 0 auto; /* Asegura que cada gráfica tenga un ancho fijo */
  width: 400px; /* Ancho fijo para cada gráfica */
  height: auto;
  text-align: center;
}

canvas {
  width: 100%; /* Asegura que el canvas ocupe todo el ancho disponible en su contenedor */
  height: auto;
  max-height: 300px; /* Altura máxima para mantener un diseño uniforme */
  box-sizing: border-box;
}

.filters {
  margin-bottom: 10px;
  width: 100%;
  text-align: center;
}

select,
input {
  margin: 5px;
  padding: 5px;
  font-size: 1em;
  width: auto;
}

label {
  font-size: 1em;
  margin-bottom: 5px;
  display: block;
}

.chart-container::-webkit-scrollbar {
  display: none; /* Oculta la barra de desplazamiento en navegadores basados en WebKit */
}

.chart-container {
  -ms-overflow-style: none; /* Oculta la barra de desplazamiento en IE/Edge */
  scrollbar-width: none; /* Oculta la barra de desplazamiento en Firefox */
}

h1 {
  text-align: center;
  margin-top: 20px;
  font-size: 1.5em;
  color: #333;
}

`;

  static properties = {
    datos: { type: Array },
    seleccionDia: { type: String },
    seleccionMes: { type: String },
    seleccionAno: { type: String },
    visitasDia: { type: Object },
    visitasMes: { type: Object },
    visitasAno: { type: Object },
  };

  constructor() {
    super();
    this.datos = [];
    this.seleccionDia = new Date().toISOString().split("T")[0];
    this.seleccionMes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    this.seleccionAno = new Date().getFullYear().toString();
    this.visitasDia = {};
    this.visitasMes = {};
    this.visitasAno = {};
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
      this.updateAllCharts();
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    }
  }

  filterDataByRange(startDate, endDate) {
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

  updateChart(chartId, data) {
    const ctx = this.shadowRoot.querySelector(`#${chartId}`).getContext("2d");

    if (this[`${chartId}Instance`]) {
      this[`${chartId}Instance`].destroy();
    }

    const labels = Object.keys(data); // Usuarios
    const dataMañana = labels.map((usuario) => data[usuario].mañana);
    const dataTarde = labels.map((usuario) => data[usuario].tarde);
    const dataNoche = labels.map((usuario) => data[usuario].noche);

    this[`${chartId}Instance`] = new Chart(ctx, {
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

  updateDiaChart() {
    const selectedDate = this.seleccionDia; // Mantener como string en formato YYYY-MM-DD

    // Filtrar los datos que coincidan exactamente con el día seleccionado
    const filteredData = this.datos.filter((d) => {
      const fecha = d.fecha_inicio; // Suponiendo que fecha_inicio es un objeto Date
      const fechaString = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
      return fechaString === selectedDate;
    });

    // Calcular visitas por usuario
    this.visitasDia = this.calculateVisitsByUser(filteredData);

    // Actualizar el gráfico
    this.updateChart("chart-dia", this.visitasDia);
  }


  updateMesChart() {
    const [year, month] = this.seleccionMes.split("-");
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const filteredData = this.filterDataByRange(startDate, endDate);
    this.visitasMes = this.calculateVisitsByUser(filteredData);
    this.updateChart("chart-mes", this.visitasMes);
  }

  updateAnoChart() {
    const year = parseInt(this.seleccionAno, 10);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    const filteredData = this.filterDataByRange(startDate, endDate);
    this.visitasAno = this.calculateVisitsByUser(filteredData);
    this.updateChart("chart-ano", this.visitasAno);
  }

  updateAllCharts() {
    this.updateDiaChart();
    this.updateMesChart();
    this.updateAnoChart();
  }

  handleDiaChange(event) {
    this.seleccionDia = event.target.value;
    this.updateDiaChart();
  }

  handleMesChange(event) {
    this.seleccionMes = event.target.value;
    this.updateMesChart();
  }

  handleAnoChange(event) {
    this.seleccionAno = event.target.value;
    this.updateAnoChart();
  }

  render() {
    return html`
      <h3>Gráfico de Visitas por Hora y Usuario</h3>
      <div class="chart-container">
  <div class="chart-item">
    <h4>Por Día</h4>
    <input
      type="date"
      @change="${this.handleDiaChange}"
      value="${this.seleccionDia}"
    />
    <canvas id="chart-dia"></canvas>
  </div>
  <div class="chart-item">
    <h4>Por Mes</h4>
    <input
      type="month"
      @change="${this.handleMesChange}"
      value="${this.seleccionMes}"
    />
    <canvas id="chart-mes"></canvas>
  </div>
  <div class="chart-item">
    <h4>Por Año</h4>
    <input
      type="number"
      min="2000"
      max="2100"
      @change="${this.handleAnoChange}"
      value="${this.seleccionAno}"
    />
    <canvas id="chart-ano"></canvas>
  </div>
</div>


    `;
  }
}

customElements.define("visitas-por-hora-por-usuario-chart", VisitasPorHoraPorUsuarioChart);

import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { DatosFidelización } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class VisitasPorHoraChart extends LitElement {
    static styles = css`
    .charts-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

canvas {
  width: 400px; /* Tamaño fijo para evitar redimensionamiento */
  height: 400px;
}

.chart-card {
  flex: 1;
  text-align: center;
  min-width: 400px; /* Asegura un espacio mínimo constante */
}


    select,
    input {
      margin: 10px;
      padding: 5px;
      font-size: 1em;
    }

    .percentages {
      margin-top: 20px;
      font-size: 1.2em;
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
        this.visitasDia = { mañana: 0, tarde: 0, noche: 0 };
        this.visitasMes = { mañana: 0, tarde: 0, noche: 0 };
        this.visitasAno = { mañana: 0, tarde: 0, noche: 0 };
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
                            datosFidelizacion.push(new DatosFidelización(null, fechaInicio, null, null));
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

    calculateVisits(visitas) {
        const conteo = { mañana: 0, tarde: 0, noche: 0 };
        const totalVisitas = visitas.length;

        visitas.forEach((visita) => {
            const hora = visita.fecha_inicio.getHours();
            if (hora >= 6 && hora < 12) {
                conteo.mañana++;
            } else if (hora >= 12 && hora < 17) {
                conteo.tarde++;
            } else {
                conteo.noche++;
            }
        });

        return {
            mañana: ((conteo.mañana / totalVisitas) * 100).toFixed(2),
            tarde: ((conteo.tarde / totalVisitas) * 100).toFixed(2),
            noche: ((conteo.noche / totalVisitas) * 100).toFixed(2),
        };
    }

    updateChart(chartId, data) {
        const ctx = this.shadowRoot.querySelector(`#${chartId}`).getContext("2d");

        if (this[`${chartId}Instance`]) {
            this[`${chartId}Instance`].destroy();
        }

        this[`${chartId}Instance`] = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Mañana", "Tarde", "Noche"],
                datasets: [
                    {
                        data: [data.mañana, data.tarde, data.noche],
                        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                const label = tooltipItem.label || "";
                                const value = tooltipItem.raw || 0;
                                return `${label}: ${value}%`;
                            },
                        },
                    },
                },
            },
        });
    }

    updateDiaChart() {
        // Convertimos la fecha seleccionada (string) en un formato base para comparar
        const selectedDate = this.seleccionDia; // Mantener como string en formato YYYY-MM-DD

        // Filtrar los datos que coincidan exactamente con el día seleccionado
        const filteredData = this.datos.filter((d) => {
            const fecha = d.fecha_inicio; // Suponiendo que fecha_inicio es un objeto Date
            const fechaString = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
            return fechaString === selectedDate;
        });

        // Calcular visitas (mañana, tarde, noche)
        this.visitasDia = this.calculateVisits(filteredData);

        // Actualizar el gráfico
        this.updateChart("chart-dia", this.visitasDia);
    }



    updateMesChart() {
        const [year, month] = this.seleccionMes.split("-");
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const filteredData = this.filterDataByRange(startDate, endDate);
        this.visitasMes = this.calculateVisits(filteredData);
        this.updateChart("chart-mes", this.visitasMes);
    }

    updateAnoChart() {
        const year = parseInt(this.seleccionAno, 10);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        const filteredData = this.filterDataByRange(startDate, endDate);
        this.visitasAno = this.calculateVisits(filteredData);
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
      <h3>Gráficos de Visitas por Hora</h3>
      <div class="charts-container">
        <div class="chart-card">
          <h4>Por Día</h4>
          <input
            type="date"
            @change="${this.handleDiaChange}"
            value="${this.seleccionDia}"
          />
          <canvas id="chart-dia"></canvas>
        </div>
        <div class="chart-card">
          <h4>Por Mes</h4>
          <input
            type="month"
            @change="${this.handleMesChange}"
            value="${this.seleccionMes}"
          />
          <canvas id="chart-mes"></canvas>
        </div>
        <div class="chart-card">
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

customElements.define("visitas-por-hora-chart", VisitasPorHoraChart);

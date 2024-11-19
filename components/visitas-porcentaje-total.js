import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { DatosFidelización } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class VisitasPorHoraChart extends LitElement {
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
    .percentages {
      margin-top: 20px;
      text-align: center;
      font-size: 1.2em;
    }
  `;

    static properties = {
        datos: { type: Array },
        filtro: { type: String },
        seleccionDia: { type: String },
        seleccionMes: { type: String },
        seleccionAno: { type: String },
        visitasPorcentaje: { type: Object },
    };

    constructor() {
        super();
        this.datos = [];
        this.filtro = "mes"; // Valor predeterminado
        this.seleccionDia = "";
        this.seleccionMes = "";
        this.seleccionAno = "";
        this.visitasPorcentaje = { mañana: 0, tarde: 0, noche: 0 };
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
            this.updateChart();
        } catch (error) {
            console.error("Error fetching data from Firebase:", error);
        }
    }

    applyFilter() {
        let startDate, endDate;

        if (this.filtro === "dia" && this.seleccionDia) {
            const selectedDate = new Date(this.seleccionDia);
            startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
            endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
        } else if (this.filtro === "mes" && this.seleccionMes) {
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

        const porcentajes = {
            mañana: ((conteo.mañana / totalVisitas) * 100).toFixed(2),
            tarde: ((conteo.tarde / totalVisitas) * 100).toFixed(2),
            noche: ((conteo.noche / totalVisitas) * 100).toFixed(2),
        };

        this.visitasPorcentaje = porcentajes;
        return porcentajes;
    }

    updateChart() {
        const ctx = this.shadowRoot.querySelector("canvas").getContext("2d");
        const filteredData = this.applyFilter();
        const visitasPorcentaje = this.calculateVisits(filteredData);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Mañana", "Tarde", "Noche"],
                datasets: [
                    {
                        data: [
                            visitasPorcentaje.mañana,
                            visitasPorcentaje.tarde,
                            visitasPorcentaje.noche,
                        ],
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

    handleFilterChange(event) {
        this.filtro = event.target.value;
        this.updateChart();
    }

    handleDateChange(event) {
        const value = event.target.value;

        if (this.filtro === "dia") {
            this.seleccionDia = value;
        } else if (this.filtro === "mes") {
            this.seleccionMes = value;
        } else if (this.filtro === "año") {
            this.seleccionAno = value;
        }

        this.updateChart();
    }

    render() {
        return html`
      <h3>Gráfico de Visitas por Hora</h3>
      <select @change="${this.handleFilterChange}">
        <option value="dia">Día</option>
        <option value="mes" selected>Mes</option>
        <option value="año">Año</option>
      </select>

      ${this.filtro === "dia"
                ? html`<input
            type="date"
            @change="${this.handleDateChange}"
            value="${this.seleccionDia || new Date().toISOString().split("T")[0]}"
          />`
                : ""}
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
      <div class="percentages">
        <p>Mañana: ${this.visitasPorcentaje.mañana}%</p>
        <p>Tarde: ${this.visitasPorcentaje.tarde}%</p>
        <p>Noche: ${this.visitasPorcentaje.noche}%</p>
      </div>
    `;
    }
}

customElements.define("visitas-por-hora-chart", VisitasPorHoraChart);

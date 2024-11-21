import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Pago } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class ConsumoPorUsuarioCharts extends LitElement {
    static styles = css`
.chart-container {
  display: flex;
  gap: 20px;
  overflow-x: auto; /* Habilita el scroll horizontal */
  overflow-y: hidden; /* Elimina el scroll vertical */
  padding: 10px;
  white-space: nowrap; /* Previene el salto de línea */
  box-sizing: border-box; /* Asegura que el padding no agregue tamaño adicional */
  scroll-behavior: smooth; /* Suaviza el desplazamiento */
}



 .chart-item {
  flex: 0 0 auto; /* Evita que los gráficos se redimensionen */
  width: 90%; /* En pantallas pequeñas, los gráficos ocupan el 90% del viewport */
  max-width: 400px; /* Límite máximo para pantallas grandes */
  height: auto; /* Ajusta la altura dinámicamente */
  margin: 0;
}



canvas {
  width: 100%; /* Ocupa todo el ancho del contenedor */
  height: auto; /* Mantiene la proporción */
  max-height: 300px; /* Límite máximo de altura */
  box-sizing: border-box; /* Asegura que el padding no afecte el tamaño */
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
    width: 90%;
  }

  label {
    font-size: 1em;
    margin-bottom: 5px;
    display: block;
  }

  .chart-container::-webkit-scrollbar {
    display: none;
  }

  .chart-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  h1 {
    text-align: center;
    margin-top: 20px;
    font-size: 1.5em;
    color: #333;
  }
    @media (max-width: 768px) {
  .chart-container {
    gap: 10px; /* Reduce el espacio entre gráficos */
  }

  .chart-item {
    width: 90%; /* Los gráficos ocupan casi todo el ancho del viewport */
    max-width: none; /* Elimina restricciones de ancho máximo */
  }
}

`;

    static properties = {
        datos: { type: Array },
        filtros: { type: Object },
        totals: { type: Object },
        chartInstances: { type: Object },
    };

    constructor() {
        super();
        this.datos = [];
        this.filtros = {
            dia: new Date().toISOString().split("T")[0],
            mes: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
            ano: new Date().getFullYear().toString(),
        };
        this.totals = { dia: {}, mes: {}, ano: {} };
        this.chartInstances = {};
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

                Object.keys(data).forEach((userId) => {
                    const userEntries = data[userId];

                    Object.keys(userEntries).forEach((entryId) => {
                        const entry = userEntries[entryId];

                        const fechaInicio =
                            entry.fecha_inicio && entry.fecha_inicio.toDate
                                ? entry.fecha_inicio.toDate()
                                : null;

                        const pagos = entry.pago
                            ? Object.values(entry.pago).map((p) => ({
                                propina: parseFloat(p?.propina || "0"),
                                tipo: p?.tipo || "desconocido",
                                total: parseFloat(p?.total || "0"), // Convertimos a número
                            }))
                            : [];


                        if (fechaInicio) {
                            datosFidelizacion.push({
                                usuario: userId,
                                fecha_inicio: fechaInicio,
                                pagos,
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


    applyFilter(type) {
        if (!this.filtros[type]) {
            return [];
        }

        const { dia, mes, ano } = this.filtros;

        let startDate, endDate;

        if (type === "dia") {
            // Convertir la fecha seleccionada a string
            const selectedDate = new Date(dia);
            const selectedDateStr = selectedDate.toISOString().split("T")[0];

            // Filtrar los datos por fecha exacta
            return this.datos.filter((d) => {
                const fechaInicioStr = d.fecha_inicio.toISOString().split("T")[0];
                return fechaInicioStr === selectedDateStr;
            });
        }

        if (type === "mes") {
            const [selectedYear, selectedMonth] = mes.split("-").map(Number);

            return this.datos.filter((d) => {
                const fecha = d.fecha_inicio;
                return (
                    fecha.getFullYear() === selectedYear &&
                    fecha.getMonth() + 1 === selectedMonth
                );
            });
        }

        if (type === "ano") {
            const selectedYear = parseInt(ano, 10);

            return this.datos.filter((d) => {
                return d.fecha_inicio.getFullYear() === selectedYear;
            });
        }

        return [];
    }

    generateColor(usuario) {
        const hash = usuario.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const red = (hash * 73) % 255;
        const green = (hash * 101) % 255;
        const blue = (hash * 37) % 255;
        return `rgba(${red}, ${green}, ${blue}, 0.8)`; // Opacidad fija
    }


    updateChart(type) {
        const filteredData = this.applyFilter(type);
        const totals = {};
    
        filteredData.forEach((dato) => {
            const usuario = dato.usuario;
            if (!totals[usuario]) totals[usuario] = 0;
    
            dato.pagos.forEach((pago) => {
                totals[usuario] += pago.total;
            });
        });
    
        this.totals[type] = totals;
    
        const labels = Object.keys(totals);
        const data = Object.values(totals);
    
        // Si no hay datos, inicializa con un valor predeterminado
        const chartData = {
            labels: labels.length > 0 ? labels : ["Sin datos"],
            datasets: [
                {
                    label: `Consumo (${type})`,
                    data: data.length > 0 ? data : [0], // Asegura que siempre haya al menos un dato
                    backgroundColor: labels.map((usuario) =>
                        this.generateColor(usuario)
                    ),
                    borderColor: labels.map((usuario) =>
                        this.generateColor(usuario).replace("0.8", "1")
                    ),
                    borderWidth: 1,
                    barThickness: 15,
                    maxBarThickness: 20,
                },
            ],
        };
    
        const canvas = this.shadowRoot.querySelector(`#chart-${type}`);
        const ctx = canvas.getContext("2d");
    
        if (this.chartInstances[type]) {
            this.chartInstances[type].destroy();
        }
    
        this.chartInstances[type] = new Chart(ctx, {
            type: "bar",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true, // Asegura que siempre empiece en 0
                        min: 0, // Refuerza que el mínimo del eje Y sea 0
                        ticks: {
                            stepSize: 10, // Personaliza los intervalos según los datos
                        },
                    },
                    x: {
                        ticks: {
                            autoSkip: true,
                            maxRotation: 45,
                            minRotation: 0,
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                    },
                },
            },
        });
    }
    





    updateAllCharts() {
        ["dia", "mes", "ano"].forEach((type) => this.updateChart(type));
    }

    handleFilterChange(event, type) {
        this.filtros[type] = event.target.value;
        this.updateChart(type);
    }

    renderChart(type, label, inputType) {
        return html`
      <div class="chart-item">
        <div class="filters">
          <label>${label}:</label>
          <input
            type="${inputType}"
            .value="${this.filtros[type]}"
            @change="${(e) => this.handleFilterChange(e, type)}"
          />
        </div>
        <canvas id="chart-${type}"></canvas>
      </div>
    `;
    }

    render() {
        return html`
      <div>
        <h1>Gráficas de Consumo por Usuario</h1>
        <div class="chart-container">
          ${this.renderChart("dia", "Filtro por Día", "date")}
          ${this.renderChart("mes", "Filtro por Mes", "month")}
          ${this.renderChart("ano", "Filtro por Año", "number")}
        </div>
      </div>
    `;
    }
}

customElements.define("consumo-por-usuario-charts", ConsumoPorUsuarioCharts);

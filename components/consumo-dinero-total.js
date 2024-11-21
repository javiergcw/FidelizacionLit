import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Pago } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class PaymentMethodConsumptionChart extends LitElement {
    static styles = css`
    .chart-container {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding: 10px;
      white-space: nowrap;
      box-sizing: border-box;
      scroll-behavior: smooth;
    }

    .chart-item {
      flex: 0 0 auto;
      width: 400px;
      height: auto;
      margin: 0;
    }

    canvas {
      width: 100%;
      height: auto;
      max-height: 300px;
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
  `;

    static properties = {
        datos: { type: Array },
        filtros: { type: Object },
        totales: { type: Object },
        chartInstances: { type: Object },
    };

    constructor() {
        super();
        this.datos = [];
        this.tiposDePago = []; // Nueva propiedad para almacenar los tipos de pago dinámicos
        this.filtros = {
            dia: new Date().toISOString().split("T")[0],
            mes: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
            ano: new Date().getFullYear().toString(),
        };
        this.totales = { dia: 0, mes: 0, ano: 0 };
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
            const tiposDePagoSet = new Set(); // Usamos un Set para evitar duplicados

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

                        const pagos = item.pago
                            ? Object.values(item.pago).map((p) => {
                                if (p?.tipo) tiposDePagoSet.add(p.tipo); // Agregar tipo de pago al Set
                                return {
                                    propina: parseFloat(p?.propina) || 0,
                                    tipo: p?.tipo || "desconocido",
                                    total: parseFloat(p?.total) || 0,
                                };
                            })
                            : [];

                        if (fechaInicio) {
                            datosFidelizacion.push({
                                fecha_inicio: fechaInicio.toISOString().split("T")[0],
                                pagos,
                            });
                        }
                    });
                });
            });

            this.datos = datosFidelizacion;
            this.tiposDePago = Array.from(tiposDePagoSet); // Convertir Set a Array
            console.log("Tipos de pago dinámicos:", this.tiposDePago); // Verificar los tipos de pago
            this.updateAllCharts();
        } catch (error) {
            console.error("Error fetching data from Firebase:", error);
        }
    }


    applyFilter(type) {
        console.log(`Aplicando filtro: ${type}, valor: ${this.filtros[type]}`);
        if (!this.filtros[type]) return [];

        let filtered = [];
        if (type === "dia") {
            filtered = this.datos.filter((d) => d.fecha_inicio === this.filtros[type]);
        } else if (type === "mes") {
            filtered = this.datos.filter((d) => d.fecha_inicio.startsWith(this.filtros[type]));
        } else if (type === "ano") {
            filtered = this.datos.filter((d) => d.fecha_inicio.startsWith(this.filtros[type]));
        }

        console.log(`Datos filtrados (${type}):`, filtered);
        return filtered;
    }

    updateChart(type) {
        const filteredData = this.applyFilter(type);

        // Usa los tipos de pago dinámicos
        const groupedData = this.tiposDePago.reduce((acc, tipo) => {
            acc[tipo] = 0; // Inicializa cada tipo de pago con 0
            return acc;
        }, {});

        // Sumar los valores de los datos filtrados
        filteredData.forEach((dato) => {
            dato.pagos.forEach((pago) => {
                if (groupedData.hasOwnProperty(pago.tipo)) {
                    groupedData[pago.tipo] += parseFloat(pago.total) || 0;
                }
            });
        });

        const labels = this.tiposDePago;
        const data = labels.map((label) => groupedData[label] || 0);

        const backgroundColors = labels.map((label) => {
            if (!this.coloresPorTipo) this.coloresPorTipo = {};
            if (!this.coloresPorTipo[label]) {
                this.coloresPorTipo[label] = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
                    Math.random() * 255
                )}, ${Math.floor(Math.random() * 255)}, 0.6)`;
            }
            return this.coloresPorTipo[label];
        });

        const canvas = this.shadowRoot.querySelector(`#chart-${type}`);
        const ctx = canvas.getContext("2d");

        if (this.chartInstances[type]) {
            this.chartInstances[type].destroy();
        }

        this.chartInstances[type] = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: `Consumo Total (${type})`,
                        data,
                        backgroundColor: backgroundColors.map((color) => color.replace("0.6", "1.0")),
                        borderWidth: 1,
                        borderColor: backgroundColors.map((color) => color.replace("0.6", "1.0")),
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        barPercentage: 0.5, // Ajusta este valor para hacer las barras más delgadas
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                    },
                },
                elements: {
                    bar: {
                        borderWidth: 2, // Grosor de los bordes de las barras
                    },
                },
            },
            
        });

        this.requestUpdate();
    }







    updateAllCharts() {
        ["dia", "mes", "ano"].forEach((type) => this.updateChart(type));
    }

    handleFilterChange(event, type) {
        this.filtros[type] = event.target.value;
        console.log(`Filtro cambiado (${type}): ${this.filtros[type]}`);
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
                <div style="text-align: center; margin-top: 10px;">
    ${Object.entries(this.totales[type] || {}).map(
            ([tipo, total]) =>
                html`<p>Total de ${tipo}: <strong>$${total.toFixed(2)}</strong></p>`
        )}
</div>

            </div>
        `;
    }

    render() {
        return html`
            <div>
                <h1>Consumo Total por Métodos de Pago</h1>
                <div class="chart-container">
                    ${this.renderChart("dia", "Consumo Diario", "date")}
                    ${this.renderChart("mes", "Consumo Mensual", "month")}
                    ${this.renderChart("ano", "Consumo Anual", "number")}
                </div>
            </div>
        `;
    }
}

customElements.define("payment-method-consumption-chart", PaymentMethodConsumptionChart);

import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Producto } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class FirebaseUserProductChart extends LitElement {
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
        chartInstances: { type: Object },
        filtros: { type: Object },
        totals: { type: Object },
    };

    constructor() {
        super();
        this.datos = [];
        this.chartInstances = {};
        this.filtros = {
            dia: new Date().toISOString().split("T")[0],
            mes: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
            ano: new Date().getFullYear().toString(),
        };
        this.totals = { dia: {}, mes: {}, ano: {} };
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

                        const productos = entry.producto
                            ? Object.values(entry.producto).map(
                                (pr) =>
                                    new Producto(
                                        parseInt(pr?.cantidad) || 0,
                                        pr?.idproducto || "desconocido",
                                        parseInt(pr?.precio) || 0,
                                        pr?.producto || "desconocido"
                                    )
                            )
                            : [];

                        if (fechaInicio) {
                            datosFidelizacion.push({
                                usuario: userId,
                                fecha_inicio: fechaInicio,
                                productos,
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

        if (type === "dia") {
            const selectedDateStr = this.filtros.dia; // Fecha seleccionada como string (YYYY-MM-DD)

            return this.datos.filter((d) => {
                const fechaInicio = d.fecha_inicio instanceof Date ? d.fecha_inicio : new Date(d.fecha_inicio);
                if (isNaN(fechaInicio.getTime())) {
                    return false;
                }

                const offsetTime = new Date(fechaInicio);
                offsetTime.setHours(offsetTime.getHours() - 5); // Ajustar a UTC-5 si es necesario
                const fechaInicioStr = offsetTime.toISOString().split("T")[0];

                const isSameDay = fechaInicioStr === selectedDateStr;
                return isSameDay;
            });
        }

        if (type === "mes") {
            const [selectedYear, selectedMonth] = this.filtros.mes.split("-").map(Number); // Año y mes seleccionados

            return this.datos.filter((d) => {
                const fechaInicio = d.fecha_inicio instanceof Date ? d.fecha_inicio : new Date(d.fecha_inicio);
                if (isNaN(fechaInicio.getTime())) {
                    return false;
                }

                const offsetTime = new Date(fechaInicio);
                offsetTime.setHours(offsetTime.getHours() - 5); // Ajustar a UTC-5 si es necesario
                const isSameMonth =
                    offsetTime.getFullYear() === selectedYear && offsetTime.getMonth() + 1 === selectedMonth;

                return isSameMonth;
            });
        }

        if (type === "ano") {
            const selectedYear = Number(this.filtros.ano); // Año seleccionado

            return this.datos.filter((d) => {
                const fechaInicio = d.fecha_inicio instanceof Date ? d.fecha_inicio : new Date(d.fecha_inicio);
                if (isNaN(fechaInicio.getTime())) {
                    return false;
                }

                const offsetTime = new Date(fechaInicio);
                offsetTime.setHours(offsetTime.getHours() - 5); // Ajustar a UTC-5 si es necesario
                const isSameYear = offsetTime.getFullYear() === selectedYear;

                return isSameYear;
            });
        }

        return [];
    }



    updateChart(type) {
        const filteredData = this.applyFilter(type);
        const labels = [];
        const datasets = {};
        let totalPorUsuario = {};


        filteredData.forEach((dato) => {
            const usuario = dato.usuario;
            if (!datasets[usuario]) {
                datasets[usuario] = {
                    label: usuario,
                    data: [],
                    backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`,
                };
                totalPorUsuario[usuario] = 0;
            }

            dato.productos.forEach((producto) => {
                const subtotal = producto.cantidad * producto.precio;
                totalPorUsuario[usuario] += subtotal;

                let labelIndex = labels.indexOf(producto.producto);
                if (labelIndex === -1) {
                    labels.push(producto.producto);

                    // Asegúrate de que todos los datasets tengan valores inicializados para el nuevo label
                    Object.values(datasets).forEach((dataset) => {
                        while (dataset.data.length < labels.length) {
                            dataset.data.push(0); // Agrega un valor inicial de 0 para los nuevos labels
                        }
                    });

                    labelIndex = labels.length - 1;
                }

                // Solo sumamos una vez el subtotal al índice correcto
                datasets[usuario].data[labelIndex] += subtotal;

                console.log("Labels:", labels);
                console.log("Datasets:", datasets);
            });
        });



        this.totals[type] = totalPorUsuario;

        const canvas = this.shadowRoot.querySelector(`#chart-${type}`);
        const ctx = canvas.getContext("2d");

        if (this.chartInstances[type]) {
            this.chartInstances[type].destroy();
        }

        this.chartInstances[type] = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: Object.values(datasets),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
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
                        borderWidth: 2, // Grosor de las barras
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
          ${Object.entries(this.totals[type] || {}).map(
            ([user, total]) =>
                html`<p>Total de ${user}: <strong>${total.toFixed(2)}</strong></p>`
        )}
        </div>
      </div>
    `;
    }

    render() {
        return html`
      <div>
        <h1 style="text-align: center; margin-top: 20px;">Consumo de Producto por Usuario</h1>
        <div class="chart-container">
          ${this.renderChart("dia", "Filtro por Día", "date")}
          ${this.renderChart("mes", "Filtro por Mes", "month")}
          ${this.renderChart("ano", "Filtro por Año", "number")}
        </div>
      </div>
    `;
    }
}

customElements.define("firebase-user-product-chart", FirebaseUserProductChart);

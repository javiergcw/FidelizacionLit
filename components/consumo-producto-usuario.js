import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Producto } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class FirebaseUserProductChart extends LitElement {
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
        userTotals: { type: Object },
    };

    constructor() {
        super();
        this.datos = [];
        this.filtro = "mes"; // Valor predeterminado
        this.seleccionDia = "";
        this.seleccionMes = "";
        this.seleccionAno = "";
        this.userTotals = {};
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

                        if (fechaInicio) {
                            datosFidelizacion.push({
                                usuario: parentKey, // Nombre del usuario como clave
                                fecha_inicio: fechaInicio,
                                productos,
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

        if (this.filtro === "dia" && this.seleccionDia) {
            const selectedDate = new Date(this.seleccionDia);
            startDate = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                0,
                0,
                0
            );
            endDate = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                23,
                59,
                59
            );
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
            if (d.fecha_inicio && d.fecha_inicio instanceof Date) {
                return d.fecha_inicio >= startDate && d.fecha_inicio <= endDate;
            }
            return false;
        });
    }

    updateChart() {
        const ctx = this.shadowRoot.getElementById("chart").getContext("2d");

        const filteredData = this.applyFilter();

        const labels = []; // Etiquetas únicas para productos
        const datasets = {}; // Conjuntos de datos separados por usuario
        const totals = {}; // Totales por usuario

        filteredData.forEach((dato) => {
            dato.productos.forEach((producto) => {
                if (!datasets[dato.usuario]) {
                    datasets[dato.usuario] = {
                        label: dato.usuario,
                        data: Array(labels.length).fill(0),
                        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255
                            }, 0.6)`,
                        borderColor: "rgba(0, 0, 0, 1)",
                        borderWidth: 1,
                    };
                    totals[dato.usuario] = 0;
                }

                let index = labels.indexOf(producto.producto);
                if (index === -1) {
                    labels.push(producto.producto);
                    Object.values(datasets).forEach((dataset) => {
                        dataset.data.push(0);
                    });
                    index = labels.length - 1;
                }

                const totalProducto = producto.cantidad * producto.precio;
                datasets[dato.usuario].data[index] += totalProducto;
                totals[dato.usuario] += totalProducto;
            });
        });

        const datasetsArray = Object.values(datasets);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: datasetsArray,
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

        this.userTotals = totals;
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
      <h3>Gráfico de consumo de producto por usuario</h3>
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
                    `${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1
                    ).padStart(2, "0")}`}"
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

      <canvas id="chart"></canvas>

      <div>
        ${Object.entries(this.userTotals || {}).map(
                    ([userId, total]) => html`<p>Consumo de ${userId}: ${total.toFixed(2)}</p>`
                )}
      </div>
    `;
    }
}

customElements.define("firebase-user-product-chart", FirebaseUserProductChart);

import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Pago } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class PaymentMethodConsumptionChart extends LitElement {
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
    .totales {
      text-align: center;
      font-size: 1.2em;
      margin-top: 10px;
    }
  `;

    static properties = {
        datos: { type: Array },
        filtro: { type: String },
        seleccionDia: { type: String },
        seleccionMes: { type: String },
        seleccionAno: { type: String },
        totalesPorTipo: { type: Object }, // Objeto para almacenar los totales
    };

    constructor() {
        super();
        this.datos = [];
        this.filtro = "mes"; // Valor predeterminado
        this.seleccionDia = "";
        this.seleccionMes = "";
        this.seleccionAno = "";
        this.totalesPorTipo = {}; // Inicializamos el objeto para los totales
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

                        if (fechaInicio) {
                            datosFidelizacion.push({ fecha_inicio: fechaInicio, pagos });
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
                0,
                0
            );
            endDate = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                23,
                59,
                59,
                999
            );
        } else if (this.filtro === "mes" && this.seleccionMes) {
            const [year, month] = this.seleccionMes.split("-");
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (this.filtro === "año" && this.seleccionAno) {
            const year = parseInt(this.seleccionAno, 10);
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date(0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }

        return this.datos.filter((d) => {
            if (d.fecha_inicio && d.fecha_inicio instanceof Date) {
                return d.fecha_inicio >= startDate && d.fecha_inicio <= endDate;
            }
            return false;
        });
    }

    updateChart() {
        const ctx = this.shadowRoot.getElementById("paymentChart").getContext("2d");

        const filteredData = this.applyFilter();
        const groupedData = {};

        // Agrupar datos por tipo de pago, sumando los totales de todos los userId
        filteredData.forEach((dato) => {
            dato.pagos.forEach((pago) => {
                if (!groupedData[pago.tipo]) {
                    groupedData[pago.tipo] = 0;
                }
                groupedData[pago.tipo] += parseFloat(pago.total); // Sumar total por tipo
            });
        });

        // Guardar los totales por tipo en la propiedad `totalesPorTipo`
        this.totalesPorTipo = groupedData;

        const labels = Object.keys(groupedData); // Tipos de pago
        const data = Object.values(groupedData); // Totales por tipo de pago

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Consumo total por tipo de pago",
                        data,
                        backgroundColor: labels.map(
                            () =>
                                `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255
                                }, 0.6)`
                        ),
                        borderColor: labels.map(
                            () =>
                                `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255
                                }, 1)`
                        ),
                        borderWidth: 1,
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
      <h3>Gráfico de Consumo por Métodos de Pago (Todos los Usuarios)</h3>
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

      <canvas id="paymentChart"></canvas>
      <div class="totales">
        ${Object.entries(this.totalesPorTipo).map(
                    ([tipo, total]) => html`<p>${tipo}: $${total.toFixed(2)}</p>`
                )}
      </div>
    `;
    }
}

customElements.define(
    "payment-method-consumption-chart",
    PaymentMethodConsumptionChart
);

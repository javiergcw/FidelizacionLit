import { LitElement, html, css } from "lit";
import * as chart from "chart.js";
import { Producto } from "../models/DatosFidelizacionModel";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

class FirebaseDataCharts extends LitElement {
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
    chartInstances: { type: Object },
    filtros: { type: Object },
    totals: { type: Object }, // Nuevo: Para almacenar los totales
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
    this.totals = { dia: 0, mes: 0, ano: 0 }; // Inicializa los totales
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

            datosFidelizacion.push({
              fecha_inicio: fechaInicio,
              productos,
            });
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
      console.log("Tipo de filtro no configurado o no soportado:", type);
      return [];
    }

    if (type === "dia") {
      const selectedDateStr = this.filtros.dia; // Fecha seleccionada como string (YYYY-MM-DD)
      console.log("Filtro seleccionado (día):", type, selectedDateStr);

      return this.datos.filter((d) => {
        const fechaInicio = d.fecha_inicio instanceof Date ? d.fecha_inicio : new Date(d.fecha_inicio);
        if (isNaN(fechaInicio.getTime())) {
          console.log("Fecha inválida encontrada:", d.fecha_inicio);
          return false;
        }

        const offsetTime = new Date(fechaInicio);
        offsetTime.setHours(offsetTime.getHours() - 5); // Ajustar a UTC-5 si es necesario
        const fechaInicioStr = offsetTime.toISOString().split("T")[0];

        const isSameDay = fechaInicioStr === selectedDateStr;
        console.log("Revisando fecha de inicio (día):", { fechaInicioStr, isSameDay, dato: d });
        return isSameDay;
      });
    }

    if (type === "mes") {
      const [selectedYear, selectedMonth] = this.filtros.mes.split("-").map(Number); // Año y mes seleccionados
      console.log("Filtro seleccionado (mes):", type, this.filtros.mes);

      return this.datos.filter((d) => {
        const fechaInicio = d.fecha_inicio instanceof Date ? d.fecha_inicio : new Date(d.fecha_inicio);
        if (isNaN(fechaInicio.getTime())) {
          console.log("Fecha inválida encontrada:", d.fecha_inicio);
          return false;
        }

        const offsetTime = new Date(fechaInicio);
        offsetTime.setHours(offsetTime.getHours() - 5); // Ajustar a UTC-5 si es necesario
        const isSameMonth =
          offsetTime.getFullYear() === selectedYear && offsetTime.getMonth() + 1 === selectedMonth;
        console.log("Revisando fecha de inicio (mes):", { offsetTime, isSameMonth, dato: d });
        return isSameMonth;
      });
    }

    if (type === "ano") {
      const selectedYear = Number(this.filtros.ano); // Año seleccionado
      console.log("Filtro seleccionado (año):", type, selectedYear);

      return this.datos.filter((d) => {
        const fechaInicio = d.fecha_inicio instanceof Date ? d.fecha_inicio : new Date(d.fecha_inicio);
        if (isNaN(fechaInicio.getTime())) {
          console.log("Fecha inválida encontrada:", d.fecha_inicio);
          return false;
        }

        const offsetTime = new Date(fechaInicio);
        offsetTime.setHours(offsetTime.getHours() - 5); // Ajustar a UTC-5 si es necesario
        const isSameYear = offsetTime.getFullYear() === selectedYear;
        console.log("Revisando fecha de inicio (año):", { offsetTime, isSameYear, dato: d });
        return isSameYear;
      });
    }

    return [];
  }






  updateChart(type) {
    const filteredData = this.applyFilter(type);
    const labels = [];
    const data = [];
    const colors = [];
    let total = 0; // Variable para calcular el total

    filteredData.forEach((dato) => {
      dato.productos.forEach((producto) => {
        const index = labels.indexOf(producto.producto);
        const subtotal = parseInt(producto.cantidad) * parseInt(producto.precio);
        total += subtotal; // Suma al total

        if (index !== -1) {
          data[index] += subtotal;
        } else {
          labels.push(producto.producto);
          data.push(subtotal);
          colors.push(`rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`);
        }
      });
    });

    this.totals[type] = total; // Almacena el total para este tipo de filtro

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
            label: `Consumo Total de Productos (${type})`,
            data: data.length > 0 ? data : [0],
            backgroundColor: data.length > 0 ? colors : ["rgba(200, 200, 200, 0.6)"],
            borderWidth: 1,
            barThickness: 10, // Grosor de las barras
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
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

    // Fuerza el tamaño después de actualizar
    this.chartInstances[type].resize();

    // Llama a requestUpdate para actualizar el texto debajo del gráfico
    this.requestUpdate();
  }



  updateAllCharts() {
    ["dia", "mes", "ano"].forEach((type) => this.updateChart(type));
  }

  handleFilterChange(event, type) {
    this.filtros[type] = event.target.value;
    this.updateChart(type);
  }

  renderChart(type, label, inputType, inputValue) {
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
        <p style="text-align: center; font-size: 1em; margin-top: 10px;">
          Total Consumo (${type}): <strong>${this.totals[type]}</strong>
        </p>
      </div>
    `;
  }


  render() {
    return html`
      <div>
        <h1 style="text-align: center; margin-top: 20px;">Consumo de Producto Total</h1>
        <div class="chart-container">
          ${this.renderChart("dia", "Filtro por Día", "date", this.filtros.dia)}
          ${this.renderChart("mes", "Filtro por Mes", "month", this.filtros.mes)}
          ${this.renderChart("ano", "Filtro por Año", "number", this.filtros.ano)}
        </div>
      </div>
    `;
  }

}

customElements.define("firebase-data-charts", FirebaseDataCharts);

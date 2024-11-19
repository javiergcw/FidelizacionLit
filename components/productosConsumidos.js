import { LitElement, html, css } from 'lit';
import * as chart from 'chart.js';

// Clase para el componente

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig'; // Asegúrate de que `firebase-config.js` exporte correctamente `db`

class ProductChart extends LitElement {
    static styles = css`
      canvas {
        width: 100%;
        max-width: 800px;
        height: 400px;
      }
    `;

    firstUpdated() {
        this._renderChart();
    }

    // Función para obtener y procesar los datos desde Firestore
    async _fetchProductData() {
        const dataRef = collection(db, 'DatosFidelizacion');
        const querySnapshot = await getDocs(dataRef);

        const productConsumption = {};

        console.log('Recuperando documentos de Firestore...');

        // Iterar por cada cliente (documento principal)
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Documento del cliente obtenido:', doc.id, data);

            // Iterar por cada compra del cliente (claves como "1", "2", etc.)
            Object.keys(data).forEach((purchaseKey) => {
                const purchaseData = data[purchaseKey];
                console.log(`Compra ${purchaseKey} del cliente ${doc.id}:`, purchaseData);

                // Verificar si esta compra tiene un campo `producto`
                if (purchaseData && purchaseData.producto) {
                    console.log(`Productos en la compra ${purchaseKey}:`, purchaseData.producto);

                    // Iterar por cada producto en la compra
                    Object.keys(purchaseData.producto).forEach((productKey) => {
                        const productData = purchaseData.producto[productKey];
                        console.log(`Procesando producto ${productKey}:`, productData);

                        const { producto: name, cantidad } = productData;

                        if (name && cantidad) {
                            // Sumar las cantidades de cada producto
                            productConsumption[name] =
                                (productConsumption[name] || 0) + parseInt(cantidad, 10);
                        }
                    });
                }
            });
        });

        console.log('Consumo total de productos procesado:', productConsumption);
        return productConsumption;
    }





    async _renderChart() {
        console.log('Iniciando generación del gráfico...');
        const productConsumption = await this._fetchProductData();

        const labels = Object.keys(productConsumption);
        const data = Object.values(productConsumption);

        console.log('Etiquetas del gráfico:', labels);
        console.log('Datos del gráfico:', data);

        if (labels.length === 0 || data.length === 0) {
            console.warn('No hay datos para mostrar en el gráfico.');
            return;
        }

        const ctx = this.shadowRoot.getElementById('productChart').getContext('2d');

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Consumo Total de Productos',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                    },
                },
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                beginAtZero: true,
                            },
                        },
                    ],
                },
            },
        });

        console.log('Gráfico generado con éxito.');
    }

    render() {
        return html`<canvas id="productChart"></canvas>`;
    }
}

customElements.define('product-chart', ProductChart);
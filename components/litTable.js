import { LitElement, html, css } from 'lit';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebaseconfig'; // Importa tu configuración de Firebase

export class LitTable extends LitElement {
    static styles = css`
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
  `;

    static properties = {
        fidelizacionData: { type: Array },
    };

    constructor() {
        super();
        this.fidelizacionData = [];
    }

    // Conecta con Firestore y carga los datos
    async connectedCallback() {
        super.connectedCallback();
        try {
            const querySnapshot = await getDocs(collection(db, "Fidelizacion"));
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            this.fidelizacionData = data;
        } catch (error) {
            console.error("Error al cargar la colección:", error);
        }
    }

    // Renderiza la tabla
    render() {
        return html`
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Puntos</th>
          </tr>
        </thead>
        <tbody>
          ${this.fidelizacionData.map(
            (item) => html`
              <tr>
                <td>${item.id}</td>
                <td>${item.cliente || "N/A"}</td>
                <td>${item.fecha || "N/A"}</td>
                <td>${item.puntos || "0"}</td>
              </tr>
            `
        )}
        </tbody>
      </table>
    `;
    }
}

// Define el componente
customElements.define('lit-table', LitTable);

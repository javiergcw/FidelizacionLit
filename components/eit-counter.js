import { LitElement, html, css } from 'lit';

export class EitCounter extends LitElement {

    static styles = css`
    :host {
        display: block;
    }
    `;

    render() {
        return html`<p>¡Hola, Lit 2.8.0!</p>`;
    }
}
customElements.define('eit-counter', EitCounter);
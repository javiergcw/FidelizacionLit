export class DatosFidelización {
    constructor(fechaFin, fechaInicio, pagos, productos) {
      this.fecha_fin = fechaFin;
      this.fecha_inicio = fechaInicio;
      this.pago = pagos;
      this.producto = productos;
    }
  }
  
  export class Pago {
    constructor(propina, tipo, total) {
      this.propina = propina;
      this.tipo = tipo;
      this.total = total;
    }
  }
  
  export class Producto {
    constructor(cantidad, idProducto, precio, producto) {
      this.cantidad = cantidad;
      this.idproducto = idProducto;
      this.precio = precio;
      this.producto = producto;
    }
  }
  
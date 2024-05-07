class LienzoInfinito {
  constructor(tamanoCelda = 30) {
    this.lienzo = null;
    this.contexto = null;
    this.tamanoCelda = tamanoCelda;
    this.escala = 1;
    this.desplazamientoX = 0;
    this.desplazamientoY = 0;
    this.gestorTarjetas = new GestorTarjetas(); 

    const lienzo = document.getElementById("canvas");
    if (lienzo && lienzo instanceof HTMLCanvasElement) {
      this.lienzo = lienzo;

      const contexto = lienzo.getContext("2d");

      if (contexto) {
        this.contexto = contexto;
        this.dibujar();
      } else {
        console.error(`<canvas> no tiene contexto 2d`);
      }
    } else {
      console.error(`<canvas> con id="canvas" no encontrado`);
    }

    // ariables paraeventos de mouse
    this.arrastrandoEnCanvas = false; //si estoy arrastrando o no algún elemento del canvas o el canvas mismo
    this.inicioArrastreX = 0;
    this.inicioArrastreY = 0;
    this.tarjetaArrastrada = null;
    
    // event listeners del mouse
    this.lienzo.addEventListener("mousedown", this.manejarMouseDown.bind(this));
    this.lienzo.addEventListener("mousemove", this.manejarMouseMove.bind(this));
    this.lienzo.addEventListener("mouseup", this.manejarMouseUp.bind(this));
    this.lienzo.addEventListener("wheel", this.manejarRuedaMouse.bind(this));

  }

  aVirtualX(xReal) {
    return (xReal + this.desplazamientoX) * this.escala;
  }

  aVirtualY(yReal) {
    return (yReal + this.desplazamientoY) * this.escala;
  }

  zoom(factor) {
    const pasos = 10; //  pasos para el zoom suave
    const factorPaso = (factor - 1) / pasos; //  zoom por paso
  
    const zoomRecursivo = (paso) => {
      if (paso <= pasos) {
        const nuevoFactor = 1 + factorPaso * paso;
        this.escala *= nuevoFactor;
        this.dibujar();
        setTimeout(() => zoomRecursivo(paso + 1), 25); // 25ms entre cada paso
      }
    };
  
    zoomRecursivo(1);
  }
  

  desplazamientoIzquierda(cantidad) {
    this.desplazamientoX += cantidad;
    this.dibujar();
  }

  desplazamientoDerecha(cantidad) {
    this.desplazamientoX -= cantidad;
    this.dibujar();
  }

  desplazamientoArriba(cantidad) {
    this.desplazamientoY += cantidad;
    this.dibujar();
  }

  desplazamientoAbajo(cantidad) {
    this.desplazamientoY -= cantidad;
    this.dibujar();
  }

  dibujar() {
    if (this.lienzo && this.contexto) {
      this.lienzo.width = document.body.clientWidth;
      this.lienzo.height = document.body.clientHeight;
      this.contexto.clearRect(0, 0, this.lienzo.width, this.lienzo.height);
      this.dibujarCuadricula();
    }
  }

  dibujarCuadricula() {
    if (this.lienzo && this.contexto) {
      this.contexto.strokeStyle = "#e1e1e1";
      this.contexto.lineWidth = 1;
      this.contexto.beginPath();

      const ancho = this.lienzo.clientWidth;
      const alto = this.lienzo.clientHeight;

      //dibujo de verticales
      const mitadAncho = ancho / 2;
      let n = Math.floor(mitadAncho / (this.tamanoCelda * this.escala));

      for (let x = ((n) * this.tamanoCelda + this.desplazamientoX) * this.escala; x >= 0; x -= this.tamanoCelda * this.escala ) {
        const origen = x;
        this.contexto.moveTo(origen, 0); //origen de línea
        this.contexto.lineTo(origen, alto); //destino de línea
      }

      for (let x = ((n + 1) * this.tamanoCelda + this.desplazamientoX) * this.escala; x <= ancho; x += this.tamanoCelda * this.escala) {
        const origen = x;
        this.contexto.moveTo(origen, 0);
        this.contexto.lineTo(origen, alto);
      }
  
      //dibujo de horizontales
      const mitadAlto = alto / 2;
      n = Math.floor(mitadAlto / (this.tamanoCelda * this.escala));
      for (let y = ((n) * this.tamanoCelda + this.desplazamientoY) * this.escala; y >= 0; y -= this.tamanoCelda * this.escala ) {
        const destino = y;
        this.contexto.moveTo(0, destino);
        this.contexto.lineTo(ancho, destino);
      }

      for (let y = ((n + 1) * this.tamanoCelda + this.desplazamientoY) * this.escala; y <= ancho; y += this.tamanoCelda * this.escala) {
        const destino = y;
        this.contexto.moveTo(0, destino);
        this.contexto.lineTo(ancho, destino);
      }
      
      //doble for por cada orientacion para centrar el zoom en un punto en un futuro (ubicación del cursor)

      this.contexto.stroke();
      this.dibujarTarjetas();
    }
  }

  dibujarTarjetas() {
    this.contexto.font = "12px Arial";

    for (const tarjeta of this.gestorTarjetas.obtenerTodas()) {
        const virtualX = this.aVirtualX(tarjeta.x);
        const virtualY = this.aVirtualY(tarjeta.y);
        const tamanoEscalar = tarjeta.tamanoOriginal * this.escala;
        this.contexto.shadowBlur = 15;
        this.contexto.shadowColor = "rgba(0, 0, 0, 0.1)";

        if (tarjeta.resaltada && (this.tarjetaArrastrada == null || this.tarjetaArrastrada == tarjeta)) {
          this.contexto.shadowColor = "rgba(100, 180, 255, 0.2)";
        }
        
        if (tarjeta.resaltada && (this.tarjetaArrastrada == null || this.tarjetaArrastrada == tarjeta)) {
          this.contexto.save(); 
          this.contexto.strokeStyle = "#40b3f2"; 
          this.contexto.lineWidth = 3; 
          this.contexto.beginPath();
          this.rectanguloRedondeado(this.contexto, virtualX, virtualY, tamanoEscalar, tamanoEscalar, 10);
          this.contexto.stroke();
          this.contexto.restore(); 
        }
        
        // mouse en zona tolerante
        this.contexto.fillStyle = tarjeta.mouseEnZonaTolerante && this.tarjetaArrastrada == null ? "#dff4f5" : "#cbeff1"; // Cambia color de fondo

        this.rectanguloRedondeado(this.contexto, virtualX, virtualY, tamanoEscalar, tamanoEscalar, 10);
        this.contexto.fill();

        // Agregar los puntos en el borde si el mouse está en la zona tolerante
        if (tarjeta.mouseEnZonaTolerante && this.tarjetaArrastrada == null) {
          const radio = 3;
          this.contexto.strokeStyle = "#40b3f2"; // color de las circunferencias
          this.contexto.lineWidth = 2; // grosor del borde

          this.contexto.beginPath();
          this.contexto.arc(virtualX + tamanoEscalar / 2, virtualY , radio, 0, Math.PI * 2); // Punto arriba
          this.contexto.stroke();
          this.contexto.beginPath();
          this.contexto.arc(virtualX + tamanoEscalar, virtualY + tamanoEscalar / 2, radio, 0, Math.PI * 2); // Punto derecha
          this.contexto.stroke();
          this.contexto.beginPath();
          this.contexto.arc(virtualX + tamanoEscalar / 2, virtualY + tamanoEscalar , radio, 0, Math.PI * 2); // Punto abajo
          this.contexto.stroke();
          this.contexto.beginPath();
          this.contexto.arc(virtualX , virtualY + tamanoEscalar / 2, radio, 0, Math.PI * 2); // Punto izquierda
          this.contexto.stroke();
        }

        this.contexto.shadowBlur = 0;
        this.contexto.fillStyle = "black";
        this.contexto.fillText(tarjeta.texto, virtualX + 10, virtualY + 20);
    }
}


//  rectángulo con bordes redondeados
rectanguloRedondeado(ctx, x, y, ancho, alto, radio) {
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + ancho - radio, y);
    ctx.arcTo(x + ancho, y, x + ancho, y + radio, radio);
    ctx.lineTo(x + ancho, y + alto - radio);
    ctx.arcTo(x + ancho, y + alto, x + ancho - radio, y + alto, radio);
    ctx.lineTo(x + radio, y + alto);
    ctx.arcTo(x, y + alto, x, y + alto - radio, radio);
    ctx.lineTo(x, y + radio);
    ctx.arcTo(x, y, x + radio, y, radio);
    ctx.closePath();
}

  agregarTarjeta(x, y, texto) {
    const xEscalar = x / this.escala - this.desplazamientoX;
    const yEscalar = y / this.escala - this.desplazamientoY;
    this.gestorTarjetas.agregar(xEscalar, yEscalar, texto);
    this.dibujar();
  }


  manejarMouseDown(evento) {
    if (evento.button === 0){

      if (this.estaEnZonaDeToleranciaTarjetas(evento.clientX, evento.clientY) == null){
        this.arrastrandoEnCanvas= true;
        this.inicioArrastreX = evento.clientX;
        this.inicioArrastreY = evento.clientY;
      }
      
      const mouseX = evento.clientX;
      const mouseY = evento.clientY;
      
      // si el mouse está sobre una tarjeta
      const todasLasTarjetas = this.gestorTarjetas.obtenerTodas();
      for (let i = todasLasTarjetas.length - 1; i >= 0; i--) { //for invertido debido a la prioridad de la tarjetas "de más arriba" en el dibujo
        const tarjeta = todasLasTarjetas[i];
        const virtualX = this.aVirtualX(tarjeta.x);
        const virtualY = this.aVirtualY(tarjeta.y);
        const tamanoEscalar = tarjeta.tamanoOriginal * this.escala;
        const tarjetaZonaDeToleranciaEnMouse = this.estaEnZonaDeToleranciaTarjetas(mouseX, mouseY);
        if (tarjetaZonaDeToleranciaEnMouse == null || todasLasTarjetas.indexOf(tarjetaZonaDeToleranciaEnMouse) < todasLasTarjetas.indexOf(tarjeta) ){
          if (
            mouseX >= virtualX &&
            mouseX <= virtualX + tamanoEscalar &&
            mouseY >= virtualY &&
            mouseY <= virtualY + tamanoEscalar
          ) {
          this.tarjetaArrastrada = tarjeta;
          this.gestorTarjetas.acomodarTarjetaAlFinal(tarjeta);
          this.inicioArrastreX = mouseX;
          this.inicioArrastreY = mouseY;
          this.dibujar();
          break;
          }
        }
      }
    }
    
  }

  manejarMouseMove(evento) {
  
    //arrastres
    if (this.tarjetaArrastrada != null) {
      // si tieen clickada una tarjetaa, mover la tarjeta en lugar de mover el lienzo
      const deltaX = evento.clientX - this.inicioArrastreX;
      const deltaY = evento.clientY - this.inicioArrastreY;
  
      const deltaXEscalar = deltaX / this.escala;
      const deltaYEscalar = deltaY / this.escala;
  
      this.tarjetaArrastrada.x += deltaXEscalar;
      this.tarjetaArrastrada.y += deltaYEscalar;
      this.inicioArrastreX = evento.clientX;
      this.inicioArrastreY = evento.clientY;
      //this.dibujar();
      this.dibujarTarjetas();
    } else if (this.arrastrandoEnCanvas) {
      //cuando estoy arrastrando el canvas

      const deltaX = evento.clientX - this.inicioArrastreX;
      const deltaY = evento.clientY - this.inicioArrastreY;
      this.desplazamientoX += deltaX / this.escala;
      this.desplazamientoY += deltaY / this.escala;
      this.inicioArrastreX = evento.clientX;
      this.inicioArrastreY = evento.clientY;
      this.dibujar();
    }

    //hovers
    this.manejarMouseHover(evento);

  }
  
  manejarMouseUp(evento) {
    if (evento.button === 0 && this.arrastrandoEnCanvas) {
      this.arrastrandoEnCanvas= false;
    }
    if (this.tarjetaArrastrada != null){
      this.tarjetaArrastrada = null;
    }
  }

  manejarRuedaMouse(evento) {
    //  dirección de la rueda
    const direccion = evento.deltaY > 0 ? -1 : 1;
    
    //  zoom según la dirección
    this.zoom(1 + (direccion * 0.05));
  }

  manejarMouseHover(evento) {
    const mouseX = evento.clientX;
    const mouseY = evento.clientY;

    const todasLasTarjetas = this.gestorTarjetas.obtenerTodas();
    let tarjetaDebajoDeMouse = null;
    let tarjetaZonaDeToleranciaEnMouse= null;
    for (let i = todasLasTarjetas.length - 1; i >= 0; i--) { //for invertido debido a la prioridad de la tarjetas "de más arriba" en el dibujo
      const tarjeta = todasLasTarjetas[i];
      const virtualX = this.aVirtualX(tarjeta.x);
      const virtualY = this.aVirtualY(tarjeta.y);
      const tamanoEscalar = tarjeta.tamanoOriginal * this.escala;
      if (
        mouseX >= virtualX &&
        mouseX <= virtualX + tamanoEscalar &&
        mouseY >= virtualY &&
        mouseY <= virtualY + tamanoEscalar
      ) {
        tarjetaDebajoDeMouse = tarjeta;
        break; //corto cuando encuentro algo a resaltar
      } else if(this.estaEnZonaDeTolerancia(mouseX, mouseY, tarjeta)){
        tarjetaZonaDeToleranciaEnMouse = tarjeta;
        break;
      }//corto cuando encuentro algo a resaltar
    }
    
    //actualizo los atributos de cada tarjeta
    for (const tarjeta of todasLasTarjetas){
        tarjeta.resaltada = tarjeta === tarjetaDebajoDeMouse;
        tarjeta.mouseEnZonaTolerante = tarjeta === tarjetaZonaDeToleranciaEnMouse;
    }

    this.dibujar();
}

  estaEnZonaDeToleranciaTarjetas(xMouse, yMouse) {
    for (const tarjeta of this.gestorTarjetas.obtenerTodas()) {
      if (this.estaEnZonaDeTolerancia(xMouse, yMouse, tarjeta)) {
        return tarjeta; //si el cursor está en la zona de tolerancia de alguna tarjeta
      }
    }
    return null; // si el cursor no está en la zona de tolerancia de ninguna tarjeta
  }

  estaEnZonaDeTolerancia(xMouse, yMouse, tarjeta) {
    const virtualX = this.aVirtualX(tarjeta.x);
    const virtualY = this.aVirtualY(tarjeta.y);
    const tamanoEscalar = tarjeta.tamanoOriginal * this.escala;
    const grosorZonaTolerancia = tarjeta.grosorZonaTolerancia; 

    //  límites de la zona de tolerancia
    const limiteIzquierdo = virtualX - grosorZonaTolerancia;
    const limiteDerecho = virtualX + tamanoEscalar + grosorZonaTolerancia;
    const limiteSuperior = virtualY - grosorZonaTolerancia;
    const limiteInferior = virtualY + tamanoEscalar + grosorZonaTolerancia;

    //  si las coordenadas del mouse están dentro de la zona de tolerancia
    return (
      (xMouse >= limiteIzquierdo && xMouse<= virtualX && yMouse >= limiteSuperior && yMouse <= limiteInferior) ||
      (xMouse <= limiteDerecho && xMouse >= tamanoEscalar + virtualX && yMouse >= limiteSuperior && yMouse <= limiteInferior) ||
      (yMouse >= limiteSuperior && yMouse <= virtualY && xMouse >=limiteIzquierdo && xMouse <= limiteDerecho) ||
      (yMouse <= limiteInferior && yMouse >= virtualY + tamanoEscalar && xMouse >=limiteIzquierdo && xMouse <= limiteDerecho)
    );
  }


}


class GestorTarjetas {
  constructor() {
    this.tarjetas = [];
  }
 
  agregar(x, y, texto) {
    const tarjeta = new Tarjeta(x, y, texto);
    this.tarjetas.push(tarjeta);
    //this.tarjetas.unshift(tarjeta);
  }
  
  limpiar() {
    this.tarjetas = [];
  }
  
  obtenerTodas() {
    return this.tarjetas;
  }
  
  eliminar(indice) {
    this.tarjetas.splice(indice, 1);
  }

  acomodarTarjetaAlFinal(tarjeta){
    let lista = this.tarjetas;
    const indicetarjeta = lista.indexOf(tarjeta);
    if (indicetarjeta !== -1) {
      lista.splice(indicetarjeta, 1); // Eliminar el tarjeta de su posición actual
      lista.push(tarjeta); // Agregar el tarjeta al final de la lista
    }
    this.tarjetas = lista;      
    
  }

}


class Tarjeta {
  constructor(x, y, texto) {
    this.x = x;
    this.y = y;
    this.texto = texto;
    //efectos visuales. (mouseEnZonaTolerante: hover, resaltada: hover en su zona de tolerancia )
    this.mouseEnZonaTolerante = false; 
    this.resaltada = false;

    this.tamanoOriginal= 100;
    this.grosorZonaTolerancia = 15;
  }
}

class Flecha {
  constructor(origen, destino, color = '#000000', grosor = 2) {
    this.origen = origen;
    this.destino = destino;
    this.color = color;
    this.grosor = grosor;
  }

  dibujar(contexto) {
    contexto.beginPath();
    contexto.strokeStyle = this.color;
    contexto.lineWidth = this.grosor;
    contexto.moveTo(this.origen.x, this.origen.y);
    contexto.lineTo(this.destino.x, this.destino.y);
    contexto.stroke();
  }

  actualizarDestino(destino) {
    this.destino = destino;
  }
}

function obtenerEnteroAleatorio(min, max) {
  //verifico rango
  if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
    throw new Error('Rango inválido: min y max deben ser números, y min debe ser menor que max.');
  }

  // número aleatorio  redondeado
  const numeroAleatorio = Math.floor(Math.random() * (max - min + 1)) + min;
  return numeroAleatorio;
}

const lienzoInfinito = new LienzoInfinito();

document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

document.getElementById("add-card").addEventListener("click", () => lienzoInfinito.agregarTarjeta(obtenerEnteroAleatorio(100, 300), obtenerEnteroAleatorio(100, 300), "Hola"));

//prueba flechac
let flechaa = new Flecha({ x: 100, y: 100 }, { x: 200, y: 200 }, "red", 1);
flechaa.dibujar(lienzoInfinito.lienzo.getContext('2d'));
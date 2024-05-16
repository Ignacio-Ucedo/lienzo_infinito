class LienzoInfinito {
  constructor(tamanoCelda = 30) {
    this.lienzo = null;
    this.contexto = null;
    this.tamanoCelda = tamanoCelda;
    this.escala = 1;
    this.desplazamientoCanvasX = 0;
    this.desplazamientoCanvasY = 0;
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

  //convierte un punto del canvas a un punto en la pantalla (coordenada x)
  aVirtualX(xCanvas) {
    return (xCanvas+ this.desplazamientoCanvasX) * this.escala;
  }

  //convierte un punto del canvas a un punto en la pantalla (coordenada y)
  aVirtualY(yCanvas) {
    return (yCanvas + this.desplazamientoCanvasY) * this.escala;
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
      this.contexto.strokeStyle = "#5c5c5c";
      this.contexto.lineWidth = 0.2;
      this.contexto.beginPath();

      const ancho = this.lienzo.clientWidth;
      const alto = this.lienzo.clientHeight;

      //dibujo de verticales
      const mitadAncho = ancho / 2;
      let n = Math.floor(mitadAncho / (this.tamanoCelda * this.escala));

      for (let x = ((n) * this.tamanoCelda + this.desplazamientoCanvasX) * this.escala; x >= 0; x -= this.tamanoCelda * this.escala ) {
        const origen = x;
        this.contexto.moveTo(origen, 0); //origen de línea
        this.contexto.lineTo(origen, alto); //destino de línea
      }

      for (let x = ((n + 1) * this.tamanoCelda + this.desplazamientoCanvasX) * this.escala; x <= ancho; x += this.tamanoCelda * this.escala) {
        const origen = x;
        this.contexto.moveTo(origen, 0);
        this.contexto.lineTo(origen, alto);
      }
  
      //dibujo de horizontales
      const mitadAlto = alto / 2;
      n = Math.floor(mitadAlto / (this.tamanoCelda * this.escala));
      for (let y = ((n) * this.tamanoCelda + this.desplazamientoCanvasY) * this.escala; y >= 0; y -= this.tamanoCelda * this.escala ) {
        const destino = y;
        this.contexto.moveTo(0, destino);
        this.contexto.lineTo(ancho, destino);
      }

      for (let y = ((n + 1) * this.tamanoCelda + this.desplazamientoCanvasY) * this.escala; y <= ancho; y += this.tamanoCelda * this.escala) {
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

  for (const flecha of this.gestorTarjetas.flechas) {
      const origenVirtualX = this.aVirtualX(flecha.origen.x);
      const origenVirtualY= this.aVirtualY(flecha.origen.y);
      const destinoVirtualX = this.aVirtualX(flecha.destino.x);
      const destinoVirtualY= this.aVirtualY(flecha.destino.y);
      this.contexto.beginPath();
      this.contexto.strokeStyle = flecha.color;
      this.contexto.lineWidth = flecha.grosor;
      this.contexto.moveTo(origenVirtualX, origenVirtualY);
      this.contexto.lineTo(destinoVirtualX, destinoVirtualY);
      this.contexto.stroke();
      
    }


    for (const tarjeta of this.gestorTarjetas.obtenerTodas()) {
        const virtualX = this.aVirtualX(tarjeta.x);
        const virtualY = this.aVirtualY(tarjeta.y);
        const tamanoEscalar = tarjeta.tamanoOriginal * this.escala;
        this.contexto.shadowBlur = 15;
        this.contexto.shadowColor = "rgba(0, 0, 0, 0.1)";

        if (tarjeta.resaltada && (this.tarjetaArrastrada == null || this.tarjetaArrastrada == tarjeta)) {
          this.contexto.shadowColor = "rgba(100, 200, 255, 0.3)";
        }
        
        if (tarjeta.resaltada && (this.tarjetaArrastrada == null || this.tarjetaArrastrada == tarjeta)) {
          this.contexto.strokeStyle = "#40b3f2"; 
          this.contexto.lineWidth = 4; 
          this.contexto.beginPath();
          this.rectanguloRedondeado(this.contexto, virtualX, virtualY, tamanoEscalar, tamanoEscalar, tamanoEscalar/10);
          this.contexto.stroke();
        }
       
        this.contexto.fillStyle = "#cbeff1"

        // mouse en zona tolerante
        this.rectanguloRedondeado(this.contexto, virtualX, virtualY, tamanoEscalar, tamanoEscalar, tamanoEscalar/10);
        this.contexto.fill();

        // Agregar los puntos en el borde si el mouse está en la zona tolerante
        if (tarjeta.mouseEnZonaTolerante && this.tarjetaArrastrada == null) {
          const radio = 5;
          this.contexto.fillStyle = "rgba(0, 165, 240, 0.7)";
          this.contexto.strokeStyle = "#00a5ff"; // color de las circunferencias
          this.contexto.lineWidth = 1; // grosor del borde

          this.contexto.beginPath();
          this.contexto.arc(virtualX + tamanoEscalar / 2, virtualY , radio, 0, Math.PI * 2); // Punto arriba
          this.contexto.stroke();
          this.contexto.fill();
          this.contexto.beginPath();
          this.contexto.arc(virtualX + tamanoEscalar, virtualY + tamanoEscalar / 2, radio, 0, Math.PI * 2); // Punto derecha
          this.contexto.stroke();
          this.contexto.fill();
          this.contexto.beginPath();
          this.contexto.arc(virtualX + tamanoEscalar / 2, virtualY + tamanoEscalar , radio, 0, Math.PI * 2); // Punto abajo
          this.contexto.stroke();
          this.contexto.fill();
          this.contexto.beginPath();
          this.contexto.arc(virtualX , virtualY + tamanoEscalar / 2, radio, 0, Math.PI * 2); // Punto izquierda
          this.contexto.stroke();
          this.contexto.fill();
        }

        this.contexto.shadowBlur = 0;
        this.contexto.fillStyle = "black";
        this.contexto.fillText(tarjeta.texto, virtualX + 10, virtualY + 20);
    }
}


//  rectángulo con bordes redondeados
rectanguloRedondeado(contexto, x, y, ancho, alto, radio) {
    contexto.beginPath();
    contexto.moveTo(x + radio, y);
    contexto.lineTo(x + ancho - radio, y);
    contexto.arcTo(x + ancho, y, x + ancho, y + radio, radio);
    contexto.lineTo(x + ancho, y + alto - radio);
    contexto.arcTo(x + ancho, y + alto, x + ancho - radio, y + alto, radio);
    contexto.lineTo(x + radio, y + alto);
    contexto.arcTo(x, y + alto, x, y + alto - radio, radio);
    contexto.lineTo(x, y + radio);
    contexto.arcTo(x, y, x + radio, y, radio);
    contexto.closePath();
}

  agregarTarjeta(x, y, texto) {
    const xEscalar = x / this.escala - this.desplazamientoCanvasX;
    const yEscalar = y / this.escala - this.desplazamientoCanvasY;
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
      const conexionesDeTarjetaArrastrada = this.gestorTarjetas.conexiones.get(this.tarjetaArrastrada);
      if (conexionesDeTarjetaArrastrada){
        for (const conexion of conexionesDeTarjetaArrastrada){
          let puntoDeConexion = conexion[1];
          puntoDeConexion.x += deltaXEscalar;
          puntoDeConexion.y += deltaYEscalar;

        }
      }
        this.dibujarTarjetas();
      } else if (this.arrastrandoEnCanvas) {
      //cuando estoy arrastrando el canvas

      const deltaX = evento.clientX - this.inicioArrastreX;
      const deltaY = evento.clientY - this.inicioArrastreY;
      this.desplazamientoCanvasX+= deltaX /this.escala;
      this.desplazamientoCanvasY+= deltaY /this.escala;
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
    this.flechas = [];
    this.conexiones = new Map();
  }
 
  agregar(x, y, texto) {
    const tarjeta = new Tarjeta(x, y, texto);
    this.tarjetas.push(tarjeta);
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

  conectarTarjetas(padre, hijo, ladoPadre, ladoHijo, escalaCanvas, contexto) {
    const puntoDeConexionPadre = this.obtenerPuntoDeConexion(padre, ladoPadre, escalaCanvas);  
    const puntoDeConexionHijo = this.obtenerPuntoDeConexion(hijo, ladoHijo, escalaCanvas);  
    const flecha = new Flecha(puntoDeConexionPadre, puntoDeConexionHijo);
    flecha.dibujar(contexto);
    this.flechas.push(flecha);


    if (!this.conexiones.has(padre)) {
        this.conexiones.set(padre, [[flecha, puntoDeConexionPadre]]);
    } else {
        this.conexiones.set(padre, this.conexiones.get(padre).push([flecha, puntoDeConexionPadre]));
    }


    if (!this.conexiones.has(hijo)) {
        this.conexiones.set(hijo, [[flecha, puntoDeConexionHijo]]);
    } else {
        this.conexiones.set(hijo, this.conexiones.get(hijo).push([flecha, puntoDeConexionHijo]));
    }

}


  obtenerPuntoDeConexion(tarjeta, lado, escalaCanvas){
    let punto = {};
    if (lado =="arriba"){
      let xRelativo = (tarjeta.tamanoOriginal * escalaCanvas)/2;
      let yRelativo = 0; 
      punto = {x: xRelativo + tarjeta.x,y: yRelativo + tarjeta.y}

    } else if (lado == "derecha"){
      let xRelativo = (tarjeta.tamanoOriginal * escalaCanvas)/2;
      let yRelativo = (tarjeta.tamanoOriginal * escalaCanvas)/2; 
      punto = {x: xRelativo + tarjeta.x,y: yRelativo + tarjeta.y}

    } else if (lado == "abajo"){
      let xRelativo = (tarjeta.tamanoOriginal * escalaCanvas)/2;
      let yRelativo = (tarjeta.tamanoOriginal * escalaCanvas);
      punto = {x: xRelativo + tarjeta.x,y: yRelativo + tarjeta.y}

    } else if (lado == "izquierda"){
      let xRelativo = 0; 
      let yRelativo = (tarjeta.tamanoOriginal * escalaCanvas)/2;
      punto = {x: xRelativo + tarjeta.x,y: yRelativo + tarjeta.y}

    }

   return punto; 
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

  dibujarFlechas(contexto){
    for (const flecha of this.flechas){
      flecha.dibujar(contexto);
    }
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

    this.tamanoOriginal= 115;
    this.grosorZonaTolerancia = 15;
  }
}

class Flecha {
  constructor(origen, destino, color = 'rgba(100, 190, 255, 1)', grosor = 2) {
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

lienzoInfinito.agregarTarjeta(obtenerEnteroAleatorio(100, 300), obtenerEnteroAleatorio(100, 300), "Hola");
lienzoInfinito.agregarTarjeta(obtenerEnteroAleatorio(100, 300), obtenerEnteroAleatorio(100, 300), "Hola");
//lienzoInfinito.agregarTarjeta(obtenerEnteroAleatorio(100, 300), obtenerEnteroAleatorio(100, 300), "Hola");
//lienzoInfinito.agregarTarjeta(obtenerEnteroAleatorio(100, 300), obtenerEnteroAleatorio(100, 300), "Hola");
let padre = lienzoInfinito.gestorTarjetas.tarjetas[0];
let hijo = lienzoInfinito.gestorTarjetas.tarjetas[1];
lienzoInfinito.gestorTarjetas.conectarTarjetas(padre,hijo, "abajo", "arriba", lienzoInfinito.escala, lienzoInfinito.contexto);
//padre = lienzoInfinito.gestorTarjetas.tarjetas[2];
//hijo = lienzoInfinito.gestorTarjetas.tarjetas[3];
//lienzoInfinito.gestorTarjetas.conectarTarjetas(padre,hijo, "abajo", "arriba", lienzoInfinito.escala, lienzoInfinito.contexto);

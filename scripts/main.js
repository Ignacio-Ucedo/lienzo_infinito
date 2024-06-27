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
    this.generandoFlecha = null;
    this.ladoGenerandoFlecha = null;
    this.tarjetaPadreGenerandoFlecha = null;
    
    // event listeners del mouse
    this.lienzo.addEventListener("mousedown", this.manejarMouseDown.bind(this));
    this.lienzo.addEventListener("mousemove", this.manejarMouseMove.bind(this));
    this.lienzo.addEventListener("mouseup", this.manejarMouseUp.bind(this));
    this.lienzo.addEventListener("wheel", this.manejarRuedaMouse.bind(this));
    this.lienzo.addEventListener("dblclick", this.manejarDobleClic.bind(this));

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
  
  //click del mouse (puede ser cualquiera de los 3)
  manejarMouseDown(evento) {
    if (evento.button === 0){ //click izquierdo presionado

      let tarjetaZonaDeToleranciaEnMouse = this.estaEnZonaDeToleranciaTarjetas(evento.clientX, evento.clientY);
      if (tarjetaZonaDeToleranciaEnMouse == null){
        this.arrastrandoEnCanvas= true;
        this.inicioArrastreX = evento.clientX;
        this.inicioArrastreY = evento.clientY;
      } else {
        let origen = { x: 0, y: 0 };
        const x = tarjetaZonaDeToleranciaEnMouse.x;
        const y = tarjetaZonaDeToleranciaEnMouse.y;
        const tamano = tarjetaZonaDeToleranciaEnMouse.tamanoOriginal;
    
        switch (tarjetaZonaDeToleranciaEnMouse.mouseEnZonaTolerante) {
            case "arriba":
                origen.x = x + tamano / 2;
                origen.y = y;
                this.ladoGenerandoFlecha = "arriba";
                break;
            case "derecha":
                origen.x = x + tamano;
                origen.y = y + tamano / 2;
                this.ladoGenerandoFlecha = "derecha";
                break;
            case "abajo":
                origen.x = x + tamano / 2;
                origen.y = y + tamano;
                this.ladoGenerandoFlecha = "abajo";
                break;
            case "izquierda":
                origen.x = x;
                origen.y = y + tamano / 2;
                this.ladoGenerandoFlecha = "izquierda";
                break;
          }
    
        if (tarjetaZonaDeToleranciaEnMouse.mouseEnZonaTolerante != "ninguno"){
          this.generandoFlecha = new Flecha(origen, origen);
          this.tarjetaPadreGenerandoFlecha = tarjetaZonaDeToleranciaEnMouse;
        }
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
    } else if(evento.button === 2){ //click derecho
    }
    
  }

  manejarMouseMove(evento) {
    if (evento.buttons != 2){ //todo menos el click derecho presionado
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
      } else if (this.arrastrandoEnCanvas) {
        //cuando estoy arrastrando el canvas
        
        const deltaX = evento.clientX - this.inicioArrastreX;
        const deltaY = evento.clientY - this.inicioArrastreY;
        this.desplazamientoCanvasX+= deltaX /this.escala;
        this.desplazamientoCanvasY+= deltaY /this.escala;
        this.inicioArrastreX = evento.clientX;
        this.inicioArrastreY = evento.clientY;
      } else if (this.generandoFlecha != null){
        //this.generandoFlecha.origen = {x: this.aVirtualX(this.generandoFlecha.origen.x), y:this.aVirtualY(this.generandoFlecha.origen.y)}
        this.generandoFlecha.destino = {x: (evento.clientX)/this.escala - this.desplazamientoCanvasX , y: (evento.clientY)/this.escala - this.desplazamientoCanvasY};
      }
      
      //hovers
      this.manejarMouseHover(evento);
    } else if(evento.buttons ===2){ //click derecho presionado, lo mismo que un else
      const mouseX = evento.clientX;
      const mouseY = evento.clientY;
      const tarjetaZonaDeToleranciaEnMouse = this.estaEnZonaDeToleranciaTarjetas(mouseX, mouseY);
      if (tarjetaZonaDeToleranciaEnMouse) {
          this.gestorTarjetas.eliminarTarjeta(tarjetaZonaDeToleranciaEnMouse);
          this.dibujar();
      }
    }
      
  }
  
  manejarMouseUp(evento) {
    if (evento.button === 0) {
      if (this.arrastrandoEnCanvas){
        this.arrastrandoEnCanvas= false;
      }
      if (this.tarjetaArrastrada != null){
        this.tarjetaArrastrada = null;
      }
      if (this.generandoFlecha != null){
        const flecha = this.generandoFlecha;
        const tarjetaPadre = this.estaEnZonaDeToleranciaTarjetas(this.aVirtualX(flecha.origen.x), this.aVirtualY(flecha.origen.y));
        const tarjetaHijo = this.estaEnZonaDeToleranciaTarjetas(evento.clientX, evento.clientY);
        if (tarjetaHijo != null){
          this.gestorTarjetas.conectarTarjetas(tarjetaPadre, tarjetaHijo, this.ladoGenerandoFlecha , tarjetaHijo.mouseEnZonaTolerante, this.contexto);
        }
  
        this.generandoFlecha = null;
        this.ladoGenerandoFlecha = null;
        this.tarjetaPadreGenerandoFlecha = null;
      }
    }
  }

  manejarDobleClic(evento){
    const mouseX = evento.clientX;
    const mouseY = evento.clientY;
    if(evento.button == 0){
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
          ) {//hice doble click sobre tarjeta:
            tarjeta.desplegarVentanaDeConfiguracion();
            break;
          }
        }
      }
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
    let tarjetaZonaDeToleranciaEnMouse = null;
    for (let i = todasLasTarjetas.length - 1; i >= 0; i--) {
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
        break;
      } else if (this.estaEnZonaDeTolerancia(mouseX, mouseY, tarjeta) != "ninguno") {
        tarjetaZonaDeToleranciaEnMouse = tarjeta;
        tarjeta.mouseEnZonaTolerante = this.estaEnZonaDeTolerancia(mouseX, mouseY, tarjeta);
        break;
      }
    }
  
    for (const tarjeta of todasLasTarjetas) {
      tarjeta.resaltada = tarjeta === tarjetaDebajoDeMouse;
      if (tarjeta != tarjetaZonaDeToleranciaEnMouse) {
        tarjeta.mouseEnZonaTolerante = "ninguno";
      }
    }
  
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
      this.contexto.strokeStyle = "#5c5c5c";
      this.contexto.lineWidth = 0.2;
      this.contexto.beginPath();

      const ancho = this.lienzo.clientWidth;
      const alto = this.lienzo.clientHeight;

      //dibujo de verticales
      //const mitadAncho = ancho / 2;
      //let n = Math.floor(mitadAncho / (this.tamanoCelda * this.escala));

      //for (let x = ((n) * this.tamanoCelda + this.desplazamientoCanvasX) * this.escala; x >= 0; x -= this.tamanoCelda * this.escala ) {
        //const origen = x;
        //this.contexto.moveTo(origen, 0); //origen de línea
        //this.contexto.lineTo(origen, alto); //destino de línea
      //}

      //for (let x = ((n + 1) * this.tamanoCelda + this.desplazamientoCanvasX) * this.escala; x <= ancho; x += this.tamanoCelda * this.escala) {
        //const origen = x;
        //this.contexto.moveTo(origen, 0);
        //this.contexto.lineTo(origen, alto);
      //}

      for (let x = (this.desplazamientoCanvasX % this.tamanoCelda) * this.escala; x <= ancho; x+= this.tamanoCelda * this.escala ){
        const origen = x;
        this.contexto.moveTo(origen, 0);
        this.contexto.lineTo(origen, alto);

      }
  
      //dibujo de horizontales
      //const mitadAlto = alto / 2;
      //let n = Math.floor(mitadAlto / (this.tamanoCelda * this.escala));
      //for (let y = ((n) * this.tamanoCelda + this.desplazamientoCanvasY) * this.escala; y >= 0; y -= this.tamanoCelda * this.escala ) {
        //const destino = y;
        //this.contexto.moveTo(0, destino);
        //this.contexto.lineTo(ancho, destino);
      //}

      //for (let y = ((n + 1) * this.tamanoCelda + this.desplazamientoCanvasY) * this.escala; y <= ancho; y += this.tamanoCelda * this.escala) {
        //const destino = y;
        //this.contexto.moveTo(0, destino);
        //this.contexto.lineTo(ancho, destino);
      //}
      //doble for por cada orientacion para centrar el zoom en un punto en un futuro (ubicación del cursor)

      for (let y = (this.desplazamientoCanvasY % this.tamanoCelda) * this.escala; y <= ancho; y+= this.tamanoCelda * this.escala ){
        const destino = y;
        this.contexto.moveTo(0, destino);
        this.contexto.lineTo(ancho,destino);

      }
      

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
        if ((tarjeta.mouseEnZonaTolerante != "ninguno" || tarjeta == this.tarjetaPadreGenerandoFlecha) && this.tarjetaArrastrada == null) {
          const radio = 5;
          this.contexto.strokeStyle = "#00a5ff"; // color de las circunferencias
          this.contexto.lineWidth = 1; // grosor del borde
      
          const dibujarPuntoCircular = (x, y, direccion) => {
            if (tarjeta.mouseEnZonaTolerante === direccion || (this.ladoGenerandoFlecha === direccion && tarjeta === this.tarjetaPadreGenerandoFlecha)) {
            //if (tarjeta.mouseEnZonaTolerante === direccion ) {
                this.contexto.fillStyle = "rgba(0, 165, 240, 1)";
                this.contexto.shadowBlur = 15;
                this.contexto.shadowColor = "rgba(100, 165, 250, 0.6)";
            } else {
                this.contexto.fillStyle = "rgba(0, 165, 240, 0.4)";
                this.contexto.shadowBlur = 0; // Sin sombra
                this.contexto.shadowColor = "rgba(0, 0, 0, 0)"; // Sin color de sombra
            }
            this.contexto.beginPath();
            this.contexto.arc(x, y, radio, 0, Math.PI * 2);
            this.contexto.stroke();
            this.contexto.fill();
          };
      
          dibujarPuntoCircular(virtualX + tamanoEscalar / 2, virtualY, "arriba"); // Punto arriba
          dibujarPuntoCircular(virtualX + tamanoEscalar, virtualY + tamanoEscalar / 2, "derecha"); // Punto derecha
          dibujarPuntoCircular(virtualX + tamanoEscalar / 2, virtualY + tamanoEscalar, "abajo"); // Punto abajo
          dibujarPuntoCircular(virtualX, virtualY + tamanoEscalar / 2, "izquierda"); // Punto izquierda
        }
      
        this.contexto.shadowBlur = 0;
        this.contexto.fillStyle = "black";
        this.contexto.fillText(tarjeta.titulo, virtualX + 10, virtualY + 20);
    }
    for (const flecha of this.gestorTarjetas.flechas) {
      const origenVirtualX = this.aVirtualX(flecha.origen.x);
      const origenVirtualY = this.aVirtualY(flecha.origen.y);
      const destinoVirtualX = this.aVirtualX(flecha.destino.x);
      const destinoVirtualY = this.aVirtualY(flecha.destino.y);
      
      this.contexto.beginPath();
      this.contexto.strokeStyle = flecha.color;
      this.contexto.lineWidth = flecha.grosor;
      this.contexto.moveTo(origenVirtualX, origenVirtualY);
      this.contexto.lineTo(destinoVirtualX, destinoVirtualY);
      this.contexto.stroke();
    
      // la punta de la flecha
      const angulo = Math.atan2(destinoVirtualY - origenVirtualY, destinoVirtualX - origenVirtualX);
      const tamañoTriangulo = 10; // lados del triángulo
    
      this.contexto.beginPath();
      this.contexto.moveTo(destinoVirtualX, destinoVirtualY);
      this.contexto.lineTo(
        destinoVirtualX - tamañoTriangulo * Math.cos(angulo - Math.PI / 6),
        destinoVirtualY - tamañoTriangulo * Math.sin(angulo - Math.PI / 6)
      );
      this.contexto.lineTo(
        destinoVirtualX - tamañoTriangulo * Math.cos(angulo + Math.PI / 6),
        destinoVirtualY - tamañoTriangulo * Math.sin(angulo + Math.PI / 6)
      );
      this.contexto.closePath();
      this.contexto.fillStyle = flecha.color;
      this.contexto.fill();
    }
    
    if (this.generandoFlecha != null){
      const origenVirtualFlechaX = this.aVirtualX(this.generandoFlecha.origen.x);
      const origenVirtualFlechaY = this.aVirtualY(this.generandoFlecha.origen.y);
      const destinoVirtualFlechaX = this.aVirtualX(this.generandoFlecha.destino.x);
      const destinoVirtualFlechaY = this.aVirtualY(this.generandoFlecha.destino.y);
      const origenVirtualFlecha = {x: origenVirtualFlechaX, y: origenVirtualFlechaY};
      const destinoVirtualFlecha = {x:destinoVirtualFlechaX, y:destinoVirtualFlechaY};
      const flechaADibujar = new Flecha(origenVirtualFlecha, destinoVirtualFlecha);

      flechaADibujar.dibujar(this.contexto);
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

  agregarTarjeta(x, y, titulo) {
    const xEscalar = x / this.escala - this.desplazamientoCanvasX;
    const yEscalar = y / this.escala - this.desplazamientoCanvasY;
    this.gestorTarjetas.agregar(xEscalar, yEscalar, titulo);
    this.dibujar();
  }

  estaEnZonaDeToleranciaTarjetas(xMouse, yMouse) {
    for (const tarjeta of this.gestorTarjetas.obtenerTodas()) {
      if (this.estaEnZonaDeTolerancia(xMouse, yMouse, tarjeta) != "ninguno") {
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

    // Límites de la zona de tolerancia
    const limiteIzquierdo = virtualX - grosorZonaTolerancia;
    const limiteDerecho = virtualX + tamanoEscalar + grosorZonaTolerancia;
    const limiteSuperior = virtualY - grosorZonaTolerancia;
    const limiteInferior = virtualY + tamanoEscalar + grosorZonaTolerancia;

    // Verificar si las coordenadas del mouse están dentro de la zona de tolerancia
    if (xMouse >= limiteIzquierdo && xMouse <= virtualX && yMouse >= virtualY && yMouse <= virtualY + tamanoEscalar) {
        return "izquierda";
    } else if (xMouse <= limiteDerecho && xMouse >= virtualX + tamanoEscalar && yMouse >= virtualY && yMouse <= virtualY + tamanoEscalar) {
        return "derecha";
    } else if (yMouse >= limiteSuperior && yMouse <= virtualY && xMouse >= virtualX && xMouse <= virtualX + tamanoEscalar) {
        return "arriba";
    } else if (yMouse <= limiteInferior && yMouse >= virtualY + tamanoEscalar && xMouse >= virtualX && xMouse <= virtualX + tamanoEscalar) {
        return "abajo";
    } else {
        return "ninguno";
    }
}


}

class GestorTarjetas {
  constructor() {
    this.tarjetas = [];
    this.flechas = [];
    this.conexiones = new Map();// mapa con tarjetas como claves y lista de listas (pares de valores flecha - punto de conexión) como valores. 
  }

  agregar(x, y, titulo) {
    const tarjeta = new Tarjeta(x, y, titulo);
    this.tarjetas.push(tarjeta);
  }


  obtenerTodas() {
    return this.tarjetas;
  }



  conectarTarjetas(padre, hijo, ladoPadre, ladoHijo) {
    const puntoDeConexionPadre = this.obtenerPuntoDeConexion(padre, ladoPadre);  
    const puntoDeConexionHijo = this.obtenerPuntoDeConexion(hijo, ladoHijo);  
    const flecha = new Flecha(puntoDeConexionPadre, puntoDeConexionHijo);
    //flecha.dibujar(contexto);
    this.flechas.push(flecha);

    if (!this.conexiones.has(padre)) {
        this.conexiones.set(padre, []);
    }
    this.conexiones.get(padre).push([flecha, puntoDeConexionPadre]);

    if (!this.conexiones.has(hijo)) {
        this.conexiones.set(hijo, []);
    }
    this.conexiones.get(hijo).push([flecha, puntoDeConexionHijo]);
  }

  obtenerPuntoDeConexion(tarjeta, lado) {
    const tamano = tarjeta.tamanoOriginal;
    const mitadTamano = tamano / 2;
    let punto = { x: 0, y: 0 };

    switch (lado) {
      case "arriba":
        punto = { x: tarjeta.x + mitadTamano, y: tarjeta.y };
        break;
      case "derecha":
        punto = { x: tarjeta.x + tamano, y: tarjeta.y + mitadTamano };
        break;
      case "abajo":
        punto = { x: tarjeta.x + mitadTamano, y: tarjeta.y + tamano };
        break;
      case "izquierda":
        punto = { x: tarjeta.x, y: tarjeta.y + mitadTamano };
        break;
    }
    return punto;
  }


  eliminarTarjeta(tarjeta) {
    this.tarjetas = this.tarjetas.filter(t => t !== tarjeta);
    this.conexiones.delete(tarjeta);
    
    // eliminar todas las flechas asociadas a la tarjeta
    this.flechas = this.flechas.filter(flecha => {
        return flecha.origen.tarjeta !== tarjeta && flecha.destino.tarjeta !== tarjeta;
    });
    
    // eliminar la tarjeta de las conexiones de otras tarjetas
    for (let [tarjetaConectada, conexiones] of this.conexiones.entries()) {
        this.conexiones.set(tarjetaConectada, conexiones.filter(conexion => conexion[0] !== tarjeta));
    }
  }

  acomodarTarjetaAlFinal(tarjeta) {
    const indiceTarjeta = this.tarjetas.indexOf(tarjeta);
    if (indiceTarjeta !== -1) {
      this.tarjetas.splice(indiceTarjeta, 1); // Eliminar la tarjeta de su posición actual
      this.tarjetas.push(tarjeta); // Agregar la tarjeta al final de la lista
    }
  }


}



class Tarjeta {
  constructor(x, y, titulo) {
    this.x = x;
    this.y = y;
    this.titulo = titulo;
    this.contenido= "contenido";
    //efectos visuales. (mouseEnZonaTolerante: hover por su zona de tolerancia, resaltada: hover)
    this.mouseEnZonaTolerante = "ninguno"; 
    this.resaltada = false;

    this.tamanoOriginal= 115;
    this.grosorZonaTolerancia = 35;

  }

  desplegarVentanaDeConfiguracion() {
    // Crear una ventana emergente con la información de la tarjeta
    const ventana = document.createElement('div');
    ventana.style.position = 'fixed';
    ventana.style.top = '0';
    ventana.style.right = '0';
    ventana.style.height = '100%';
    ventana.style.width = '300px';
    ventana.style.padding = '20px';
    ventana.style.backgroundColor = 'rgb(229,229,220)';
    ventana.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    ventana.style.zIndex = 1000;
    ventana.style.display= 'flex';
    ventana.style.alignContent = 'center';
//    ventana.style.alignItems = 'start';
    //ventana.style.flexWrap = 'wrap';
    //ventana.style.flexDirection = 'column';
    ventana.style.flexFlow = 'column wrap';

/**display: flex;
    align-content: center;
    align-items: start;
    justify-content: flex-start;
    flex-wrap: wrap;
    flex-direction: column; */
    
    
    const titulo = document.createElement('h3');
    titulo.textContent = 'Configuración de Mensaje';
    ventana.appendChild(titulo);
  
    const labelTitulo = document.createElement('label');
    labelTitulo.textContent = 'Titulo';
    ventana.appendChild(labelTitulo);
  
    const inputTitulo = document.createElement('input');
    inputTitulo.type = 'text';
    inputTitulo.value = this.titulo;
    ventana.appendChild(inputTitulo);

    const labelContenido = document.createElement('label');
    labelContenido.textContent = 'Contenido';
    ventana.appendChild(labelContenido);
  
    const inputContenido = document.createElement('input');
    inputContenido.type = 'text';
    inputContenido.value = this.contenido;
    ventana.appendChild(inputContenido);
  
    const botonCerrar = document.createElement('button');
    botonCerrar.textContent = 'Cerrar';
    botonCerrar.onclick = () => {
      document.body.removeChild(ventana);
    };
    ventana.appendChild(botonCerrar);
  
    document.body.appendChild(ventana);
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

    // la punta de la flecha
    const angulo = Math.atan2(this.destino.y - this.origen.y, this.destino.x - this.origen.x);
    const tamañoTriangulo = 10; // los lados del triángulo

    contexto.beginPath();
    contexto.moveTo(this.destino.x, this.destino.y);
    contexto.lineTo(
      this.destino.x - tamañoTriangulo * Math.cos(angulo - Math.PI / 6),
      this.destino.y - tamañoTriangulo * Math.sin(angulo - Math.PI / 6)
    );
    contexto.lineTo(
      this.destino.x - tamañoTriangulo * Math.cos(angulo + Math.PI / 6),
      this.destino.y - tamañoTriangulo * Math.sin(angulo + Math.PI / 6)
    );
    contexto.closePath();
    contexto.fillStyle = this.color;
    contexto.fill();
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
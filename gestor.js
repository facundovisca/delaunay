// ==========================================================================
// ARCHIVO: gestor.js
// CLASE GESTOR DE SEÑAL - PROCESAMIENTO Y FILTRADO ACÚSTICO (VERSIÓN ULTRA-LIVIANA)
// ==========================================================================

class GestorSenial {
  constructor(minimo_, maximo_) {
    this.minimo = minimo_;
    this.maximo = maximo_;
    
    // Estado de la señal filtrada
    this.filtrada = 0;
    this.anterior = 0;
    this.derivada = 0;
    
    // Variables de control mantenidas estrictamente por compatibilidad
    this.amplificadorDerivada = 15.0;

    // Peso del suavizado exponencial para estabilizar la lectura
    this.f = 0.8;
  }

  actualizar(entrada_) {
    // 1. Normaliza la entrada al rango [0,1] usando variables locales (cero desperdicio de memoria)
    let mapeada = map(entrada_, this.minimo, this.maximo, 0.0, 1.0);
    mapeada = constrain(mapeada, 0.0, 1.0);

    // 2. Filtro paso bajo (Suavizado Exponencial de paso único)
    this.filtrada = this.filtrada * this.f + mapeada * (1 - this.f);

    // 3. Calcula la derivada (velocidad de cambio) por compatibilidad de interfaz
    this.derivada = (this.filtrada - this.anterior) * this.amplificadorDerivada;

    // 4. Guardamos la foto actual para el próximo frame
    this.anterior = this.filtrada;
  }
}
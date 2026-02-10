interface NetworkStats {
  requests: number;
  bytesTransferred: number;
  rcu: number;
  wcu: number;
}

class NetworkMonitor {
  private stats: NetworkStats = { requests: 0, bytesTransferred: 0, rcu: 0, wcu: 0 };
  private initialized = false;
  
  init() {
    if (this.initialized) return;
    
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      this.stats.requests++;
      
      const method = init?.method || 'GET';
      const url = typeof input === 'string' ? input : input.toString();
      
      console.log(`🌐 ${method} ${url}`);
      
      try {
        const response = await originalFetch(input, init);
        
        // Estimar tamaño basado en content-length o respuesta típica
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : 2048; // 2KB por defecto
        
        this.stats.bytesTransferred += size;
        
        if (method === 'GET') {
          this.stats.rcu += Math.ceil(size / 4096);
        } else {
          this.stats.wcu += Math.ceil(size / 1024);
        }
        
        return response;
      } catch (error) {
        console.log(`❌ Error en ${method} ${url}`);
        throw error;
      }
    };
    
    this.initialized = true;
  }

  getStats() {
    return { ...this.stats };
  }

  reset() {
    this.stats = { requests: 0, bytesTransferred: 0, rcu: 0, wcu: 0 };
  }
}

export const networkMonitor = new NetworkMonitor();

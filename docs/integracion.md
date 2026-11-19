# Contrato de Integracion entre Servicios (TP 1)

## 1. Flujo de Comunicacion
* **Consumidor:** backend-node (Express + Mongoose, puerto 3000)
* **Proveedor:** backend-django (Django + DRF, puerto 8000)
* **Endpoint en Node:** GET /api/productos/:id
* **Peticion saliente hacia Django:** GET http://127.0.0.1:8000/api/orders/?product_id=:id
* **Timeout configurado:** 3000 ms (AbortSignal.timeout(3000))

## 2. Manejo de Fallos y Respuesta Degradada
Si backend-django no responde dentro de los 3000 ms o se encuentra apagado, backend-node captura el error y responde con codigo 200 OK devolviendo los datos locales del producto desde MongoDB junto con el estado degradado:

`json
{
  "producto": { "codigoSKU": "GPU-560", "stock": 15 },
  "integracionPedidos": {
    "estado": "DEGRADADO: El servicio de Pedidos (Django) no esta disponible temporalmente",
    "pedidosRecientes": []
  }
}


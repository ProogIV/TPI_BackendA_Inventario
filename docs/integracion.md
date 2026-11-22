# Contrato de integración con Pedidos

La especificación completa está en el `spec.md` del repositorio orquestador
([TPI_Ecommerce](https://github.com/ProogIV/TPI_Ecommerce)). Este archivo resume los puntos donde
Inventario se comunica con Pedidos.

## 1. Pedidos consume a Inventario (flujo de compra)

| Endpoint | Uso |
|---|---|
| `PATCH /api/productos/:id/descontar` `{ "cantidad": N }` | Descuenta stock de forma atómica. `200` con `{ _id, nombre, precio, stock }`; `400` si no alcanza; `404` si no existe |
| `PATCH /api/productos/:id/reponer` `{ "cantidad": N }` | Devuelve el stock cuando el pago del pedido falla (compensación) |

## 2. Inventario consume a Pedidos (respuesta degradada)

* **Endpoint en Inventario:** `GET /api/productos/:id`
* **Petición saliente:** `GET {PEDIDOS_API_URL}/orders/?producto_id=:id`
* **Timeout:** 5000 ms (`AbortSignal.timeout(5000)`)

Si Pedidos no responde dentro del tiempo o está apagado, Inventario igual responde `200` con los
datos del producto y el estado degradado:

```json
{
  "producto": { "codigoSKU": "GPU-560", "stock": 15 },
  "integracionPedidos": {
    "estado": "DEGRADADO: el servicio de Pedidos no está disponible temporalmente",
    "pedidosRecientes": []
  }
}
```

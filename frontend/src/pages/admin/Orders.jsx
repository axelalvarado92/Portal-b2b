import { useEffect, useState } from "react";

import { ClipboardList } from "lucide-react";

import {
  getAdminOrders,
  getAdminOrder,
} from "../../services/adminOrdersService";

import "./Orders.css";

export default function OrdersAdmin() {

  const [orders, setOrders] = useState([]);

  const [
  selectedOrder,
  setSelectedOrder,
] = useState(null);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {

    async function loadOrders() {

      try {

        const response =
          await getAdminOrders();

        setOrders(response.data || []);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadOrders();

  }, []);

  async function handleViewOrder(
    orderId
    ) {
    
      try {
    
        const response =
          await getAdminOrder(
            orderId
          );

     console.log(
      "ORDER ID:",
      orderId
    );
    
    console.log(
      "DETAIL RESPONSE:",
      response
    );
    
        setSelectedOrder(
          response.data
        );
        
        console.log(
          "SELECTED ORDER:",
          response.data
        );
    
      } catch (err) {
    
        console.error(err);
    
      }
    
    }

  if (loading) {

    return (
      <div className="admin-orders-page">
        Cargando pedidos...
      </div>
    );

  }

  const filteredOrders =
    orders.filter(order =>
      order.company_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      order.customer_email
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (

    <div className="admin-orders-page">

      <div className="page-header">

        <div>

          <h1>
            Pedidos
          </h1>

        </div>

      </div>

      <div className="orders-summary-card">

        <ClipboardList size={40} />

        <div>

          <h3>
            Total pedidos
          </h3>

          <span>
            {orders.length}
          </span>

        </div>

      </div>

      <input
        className="orders-search"
        placeholder="Buscar por empresa o cliente..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <table className="orders-table">

        <thead>

          <tr>

            <th>ID</th>

            <th>Empresa</th>

            <th>Cliente</th>

            <th>Estado</th>

            <th>Total</th>

            <th>Fecha</th>

            <th>Acciones</th>

          </tr>

        </thead>

        <tbody>

          {filteredOrders.map(order => (

            <tr key={order.id}>

              <td>
                {order.id.slice(0, 8)}
              </td>

              <td>
                {order.company_name}
              </td>

              <td>
                {order.customer_email}
              </td>

              <td>
                {order.status}
              </td>

              <td>
                $
                {order.total_amount}
              </td>

              <td>
              {
                new Date(
                  order.created_at
                ).toLocaleDateString()
              }
            </td>
            
            <td>
            
              <button
                className="snb-btn"
                onClick={() =>
                  handleViewOrder(
                    order.id
                  )
                }
              >
                Ver detalle
              </button>
            
            </td>

            </tr>

          ))}

        </tbody>

      </table>

      {selectedOrder && (

      <div className="order-detail-card">
      
        <div className="order-detail-header">
      
          <div className="order-number">
            Pedido #{selectedOrder.id.slice(0,8)}
          </div>
      
          <div className="order-status">
            {selectedOrder.status}
          </div>
      
        </div>
      
        <div className="order-info-grid">
      
          <div className="order-info-item">
            <span className="order-info-label">
              Cliente
            </span>
            <span className="order-info-value">
              {selectedOrder.customer_email}
            </span>
          </div>
      
          <div className="order-info-item">
            <span className="order-info-label">
              Empresa
            </span>
            <span className="order-info-value">
              {selectedOrder.company_name}
            </span>
          </div>
      
          <div className="order-info-item">
            <span className="order-info-label">
              Fecha
            </span>
            <span className="order-info-value">
              {
                new Date(
                  selectedOrder.created_at
                ).toLocaleDateString()
              }
            </span>
          </div>
      
          <div className="order-info-item">
            <span className="order-info-label">
              Observaciones
            </span>
            <span className="order-info-value">
              {selectedOrder.notes || "-"}
            </span>
          </div>
      
        </div>
      
        <h3>
          Productos
        </h3>
      
        <table className="products-table">
      
          <thead>
      
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
      
          </thead>
      
          <tbody>
      
            {selectedOrder.items.map(item => (
      
              <tr key={item.product_name}>
      
                <td>
                  {item.product_name}
                </td>
      
                <td>
                  {item.quantity}
                </td>
      
                <td>
                  ${item.unit_price}
                </td>
      
                <td>
                  ${item.subtotal}
                </td>
      
              </tr>
      
            ))}
      
          </tbody>
      
        </table>
      
        <div className="order-total">
          Total: ${selectedOrder.total_amount}
        </div>
      
      </div>
    
    )}

    </div>

  );

}
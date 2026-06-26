import { useParams } from "react-router-dom";

export default function ProductDetail() {

  const { id } = useParams();

  return (

    <div style={{ padding: "40px" }}>

      <h1>Detalle del producto</h1>

      <p>ID del producto:</p>

      <strong>{id}</strong>

    </div>

  );

}
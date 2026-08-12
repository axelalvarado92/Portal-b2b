import { useState } from "react";
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({ userName, onConfirm, onCancel, isDeleting }) {
  const [input, setInput] = useState("");
  const expectedText = `eliminar ${userName}`;

  const isValid = input.trim().toLowerCase() === expectedText.toLowerCase();

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <h3>¿Eliminar usuario?</h3>
        <p>
          Esta acción eliminará al usuario <strong>{userName}</strong> 
          del portal.
        </p>
        <p className="confirm-instruction">
          Para confirmar, escribí exactamente:
        </p>
        <code className="confirm-code">{expectedText}</code>
        
        <input
          type="text"
          className="confirm-input"
          placeholder={expectedText}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />

        <div className="confirm-buttons">
          <button className="snb-btn-secondary" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button 
            className="snb-btn" 
            onClick={onConfirm} 
            disabled={!isValid || isDeleting}
            style={{ backgroundColor: "#ef4444" }}
          >
            {isDeleting ? "Eliminando..." : "Confirmar eliminación"}
          </button>
        </div>
      </div>
    </div>
  );
}
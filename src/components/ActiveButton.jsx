import React from "react";

const ActiveButton = ({ goalId, currentActiveState, toggleActiveState }) => {
  return (
    <button
      onClick={() => toggleActiveState(goalId, currentActiveState)}
      style={{
        backgroundColor: currentActiveState ? "green" : "red",
        color: "white",
        padding: "5px 10px",
        border: "none",
        borderRadius: "5px",
      }}
    >
      {currentActiveState ? "Active" : "Paused"}
    </button>
  );
};

export default ActiveButton;

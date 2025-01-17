import React, { useState, useEffect, useContext } from "react"
import supabase from "../assets/supabase/client"
import { AuthContext } from "../contexts/userAuth"
import Modal from "react-modal"

const GoalsCrud = () => {
  const { user } = useContext(AuthContext)
  const [goals, setGoals] = useState([])
  const [exercise, setExercise] = useState("")
  const [sets, setSets] = useState(1)
  const [reps, setReps] = useState(1)
  const [microcycle, setMicrocycle] = useState(1)
  const [microcycles, setMicrocycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [editedGoal, setEditedGoal] = useState({})
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [allCategories, setAllCategories] = useState([])

  useEffect(() => {
    const fetchMicrocycles = async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("microcycle")
        .eq("user_id", user.id)
        .order("microcycle", { ascending: false })

      if (error) {
        console.error(error)
      } else {
        if (data.length === 0) {
          const { error: insertError } = await supabase
            .from("goals")
            .insert([
              {
                user_id: user.id,
                microcycle: 1,
                Exercise: "Default Exercise",
                Sets: 1,
                Reps: 1,
                categories: [],
              },
            ])

          if (insertError) {
            console.error(insertError)
            return
          }

          setMicrocycles([1])
          setMicrocycle(1)
        } else {
          const allMicrocycles = [...new Set(data.map(item => item.microcycle))]
          setMicrocycles(allMicrocycles)
          setMicrocycle(allMicrocycles[0])
        }
      }
    }

    const fetchGoals = async () => {
      if (!microcycle) return
      setLoading(true)
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("microcycle", microcycle)

      if (error) {
        console.error(error)
      } else {
        setGoals(data)
        const allCategoriesSet = new Set()
        data.forEach((goal) => {
          if (goal.categories && goal.categories.length) {
            goal.categories.forEach((category) => allCategoriesSet.add(category))
          }
        })
        setAllCategories([...allCategoriesSet])
      }
      setLoading(false)
    }

    if (user) {
      fetchMicrocycles()
      fetchGoals()
    }
  }, [user, microcycle])

  const createGoal = async () => {
    if (!exercise) return alert("Exercise field cannot be empty.")

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert([
          {
            Exercise: exercise,
            Sets: sets || 1,
            Reps: reps || 1,
            user_id: user.id,
            microcycle: microcycle,
            categories: categories,
          },
        ])
        .select()

      if (error) {
        console.error(error)
      } else {
        setGoals([...goals, data[0]])
        setExercise("")
        setSets(1)
        setReps(1)
        setCategories([])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const deleteGoal = async (goalId, exerciseName) => {
    // Mostrar cuadro de confirmación con el nombre del ejercicio
    const isConfirmed = window.confirm(
      `¿Estás seguro que deseas eliminar el ejercicio "${exerciseName}"?`
    )

    // Si el usuario cancela la operación, salir de la función
    if (!isConfirmed) {
      return
    }

    try {
      const { error: doneError } = await supabase
        .from("done")
        .delete()
        .eq("goals_id", goalId)

      if (doneError) {
        console.error("Error deleting related records:", doneError)
        alert("Error al eliminar registros relacionados. Por favor, intenta de nuevo.")
        return
      }


      const { error: goalError } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId)

      if (goalError) {
        console.error("Error deleting goal:", goalError)
        alert("Error al eliminar el ejercicio. Por favor, intenta de nuevo.")
        return
      }

      setGoals(goals.filter((goal) => goal.id !== goalId))
      alert("Ejercicio eliminado con éxito")

    } catch (error) {
      console.error("Error in delete operation:", error)
      alert("Error en la operación de eliminación. Por favor, intenta de nuevo.")
    }
  }

  const handleEditChange = (e, field) => {
    setEditedGoal((prev) => ({
      ...prev,
      [field]: field === "categories" ?
        (typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value) :
        e.target.value
    }))
  }

  const saveEditedGoal = async (goalId) => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .update({
          Exercise: editedGoal.Exercise,
          Sets: editedGoal.Sets,
          Reps: editedGoal.Reps,
          categories: editedGoal.categories || [],
        })
        .eq("id", goalId)
        .select()

      if (error) {
        console.error(error)
      } else if (data && data.length > 0) {
        setGoals(goals.map((goal) => (goal.id === goalId ? data[0] : goal)))
        setEditingGoalId(null)
        setEditedGoal({})
      } else {
        console.error("No data returned when updating the goal.")
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (goal) => {
    setEditingGoalId(goal.id)
    setEditedGoal({
      Exercise: goal.Exercise,
      Sets: goal.Sets,
      Reps: goal.Reps,
      categories: goal.categories || [],
    })
  }

  const createNextMicrocycle = async () => {
    if (!goals.length) {
      console.error("No goals found in the last microcycle.")
      return
    }

    try {
      const newMicrocycle = microcycle + 1
      const newGoals = goals.map(({ id, ...goalWithoutId }) => ({
        ...goalWithoutId,
        microcycle: newMicrocycle,
      }))

      const { data, error } = await supabase
        .from("goals")
        .insert(newGoals)
        .select()

      if (error) {
        console.error(error)
        return
      }

      setGoals((prevGoals) => [...prevGoals, ...data])
      setMicrocycles((prevMicrocycles) => [...prevMicrocycles, newMicrocycle])
      setMicrocycle(newMicrocycle)
    } catch (error) {
      console.error(error)
    }
  }

  const toggleActive = async (id, currentActiveState) => {
    const newActiveState = currentActiveState === 1 ? 0 : 1

    const { data, error } = await supabase
      .from("goals")
      .update({ active: newActiveState })
      .eq("id", id)
      .select()

    if (error) {
      console.error(error)
    } else {
      setGoals(goals.map((goal) => (goal.id === id ? { ...goal, active: newActiveState } : goal)))
    }
  }

  const filterGoalsByCategory = (goals) => {
    if (!filterCategory) return goals
    return goals.filter((goal) =>
      goal.categories && goal.categories.some((category) =>
        category.toLowerCase().includes(filterCategory.toLowerCase())
      )
    )
  }

  const addCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  return (
    <div>
      <button
        onClick={() => setModalIsOpen(true)}
        style={{
          position: "fixed",
          left: "20px",
          top: "20px",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Open Goals Modal
      </button>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Goals Modal"
        ariaHideApp={false}
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.75)" },
          content: {
            backgroundColor: "white",
            padding: "20px",
            maxWidth: "80%",
            margin: "auto",
            borderRadius: "8px",
          },
        }}
      >
        <label style={{ display: "block", marginBottom: "10px" }}>
          Select Microcycle:
          <select
            onChange={(e) => setMicrocycle(parseInt(e.target.value))}
            disabled={microcycles.length === 0}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            {microcycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                Microcycle {cycle}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={createNextMicrocycle}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px",
            width: "100%",
          }}
        >
          Create Next Microcycle
        </button>

        <p>Exercise:</p>
        <input
          type="text"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
        />
        <p>Sets:</p>
        <input
          type="number"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(parseInt(e.target.value) || 1)}
          style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
        />
        <p>Reps:</p>
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 1)}
          style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
        />

        <p>Categories:</p>
        {categories.map((category, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={category}
              disabled
              style={{ padding: "10px", marginBottom: "5px", width: "100%" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New Category"
            style={{
              padding: "10px",
              flex: 1,
            }}
          />
          <button
            onClick={addCategory}
            disabled={!newCategory}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: newCategory ? "pointer" : "not-allowed",
            }}
          >
            Add Category
          </button>
        </div>

        <button
          onClick={createGoal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px",
            width: "100%",
          }}
        >
          Add Goal
        </button>

        <h2>Your Goals</h2>
        <select
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
        >
          <option value="">Filter by Category</option>
          {allCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {loading ? (
          <p>Loading goals...</p>
        ) : (
          <div className="goal-container">
            {filterGoalsByCategory(goals).length > 0 ? (
              filterGoalsByCategory(goals).map((goal) => (
                <div
                  key={goal.id}
                  className="goal-card"
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  {editingGoalId === goal.id ? (
                    <div>
                      <input
                        type="text"
                        value={editedGoal.Exercise}
                        onChange={(e) => handleEditChange(e, "Exercise")}
                        style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
                      />
                      <input
                        type="number"
                        value={editedGoal.Sets}
                        onChange={(e) => handleEditChange(e, "Sets")}
                        style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
                      />
                      <input
                        type="number"
                        value={editedGoal.Reps}
                        onChange={(e) => handleEditChange(e, "Reps")}
                        style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
                      />
                      <input
                        type="text"
                        value={editedGoal.categories}
                        onChange={(e) => handleEditChange(e, "categories")}
                        placeholder="Categories (comma-separated)"
                        style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
                      />
                      <button
                        onClick={() => saveEditedGoal(goal.id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3>{goal.Exercise}</h3>
                      <p>Sets: {goal.Sets}</p>
                      <p>Reps: {goal.Reps}</p>
                      <p>Categories: {goal.categories ? goal.categories.join(", ") : "No categories"}</p>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button
                          onClick={() => handleEdit(goal)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id, goal.Exercise)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleActive(goal.id, goal.active)}
                          style={{
                            backgroundColor: goal.active ? "green" : "red",
                            color: "white",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {goal.active ? "Active" : "Paused"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No goals found for this microcycle.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default GoalsCrud
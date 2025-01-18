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
  const [allCategories, setAllCategories] = useState([]) // Nuevo estado para todas las categorías

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

        // Extraemos las categorías de los objetivos y las añadimos al estado
        const allCategoriesSet = new Set()
        data.forEach((goal) => {
          if (goal.categories && goal.categories.length) {
            goal.categories.forEach((category) => allCategoriesSet.add(category))
          }
        })
        setAllCategories([...allCategoriesSet]) // Guardamos todas las categorías únicas
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

  const deleteGoal = async (goalId) => {
    const { error } = await supabase.from("goals").delete().eq("id", goalId)

    if (error) {
      console.error(error)
    } else {
      setGoals(goals.filter((goal) => goal.id !== goalId))
    }
  }

  const handleEditChange = (e, field, goalId) => {
    setEditedGoal((prev) => ({
      ...prev,
      [field]: e.target.value,
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
          categories: editedGoal.categories,
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
      goal.categories && goal.categories.some((category) => category.toLowerCase().includes(filterCategory.toLowerCase()))
    )
  }

  const addCategory = () => {
    setCategories([...categories, newCategory])
    setNewCategory("") // Reset the input field after adding
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
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New Category"
          style={{
            padding: "10px",
            marginBottom: "10px",
            width: "100%",
          }}
        />
<button
  onClick={addCategory}
  disabled={!newCategory} // Deshabilitar si el campo está vacío
  style={{
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: newCategory ? "pointer" : "not-allowed", // Cambiar el cursor si está deshabilitado
    marginTop: "10px",
  }}
>
  +
</button>

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
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <h3>{goal.Exercise}</h3>
                  <p>Sets: {goal.Sets}</p>
                  <p>Reps: {goal.Reps}</p>
                  <p>Categories: {goal.categories ? JSON.stringify(goal.categories) : "No categories"}</p>
                  <div>
                    <button
                      onClick={() => handleEdit(goal)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        marginRight: "5px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        marginRight: "5px",
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => toggleActive(goal.id, goal.active)}
                      style={{
                        backgroundColor: goal.active ? "green" : "red",
                        color: "white",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "5px",
                      }}
                    >
                      {goal.active ? "Active" : "Paused"}
                    </button>
                  </div>
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

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
  const [categories, setCategories] = useState("")

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
      const parsedCategories = categories ? JSON.parse(categories) : []

      const { data, error } = await supabase
        .from("goals")
        .insert([
          {
            Exercise: exercise,
            Sets: sets || 1,
            Reps: reps || 1,
            user_id: user.id,
            microcycle: microcycle,
            categories: parsedCategories,
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
        setCategories("")
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
      const updatedCategories = editedGoal.categories ? JSON.parse(editedGoal.categories) : []

      const { data, error } = await supabase
        .from("goals")
        .update({
          Exercise: editedGoal.Exercise,
          Sets: editedGoal.Sets,
          Reps: editedGoal.Reps,
          categories: updatedCategories,
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

  return (
    <div>
      <button onClick={() => setModalIsOpen(true)}>Open Goals Modal</button>

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
        <h2>Add New Goal</h2>
        <label>
          Select Microcycle:
          <select
            onChange={(e) => setMicrocycle(parseInt(e.target.value))}
            disabled={microcycles.length === 0}
          >
            {microcycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                Microcycle {cycle}
              </option>
            ))}
          </select>
        </label>
        <p>Exercise:</p>
        <input
          type="text"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        />
        <p>Sets:</p>
        <input
          type="number"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(parseInt(e.target.value) || 1)}
        />
        <p>Reps:</p>
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 1)}
        />
        <p>Categories (JSON format):</p>
        <textarea
          placeholder='Enter categories as JSON, e.g. ["Cardio", "Strength"]'
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
        />
        <button onClick={createGoal}>Add Goal</button>
        <button onClick={createNextMicrocycle}>Create Next Microcycle</button>

        <h2>Your Goals</h2>
        {loading ? (
          <p>Loading goals...</p>
        ) : goals.length > 0 ? (
          <table border="1" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Categories</th>
                <th>Actions</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id}>
                  <td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="text"
                        value={editedGoal.Exercise || goal.Exercise}
                        onChange={(e) => handleEditChange(e, "Exercise", goal.id)}
                      />
                    ) : (
                      goal.Exercise
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="number"
                        value={editedGoal.Sets || goal.Sets}
                        onChange={(e) => handleEditChange(e, "Sets", goal.id)}
                      />
                    ) : (
                      goal.Sets
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="number"
                        value={editedGoal.Reps || goal.Reps}
                        onChange={(e) => handleEditChange(e, "Reps", goal.id)}
                      />
                    ) : (
                      goal.Reps
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <textarea
                        value={editedGoal.categories || JSON.stringify(goal.categories)}
                        onChange={(e) => handleEditChange(e, "categories", goal.id)}
                      />
                    ) : (
                      goal.categories ? JSON.stringify(goal.categories) : "No categories"
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <button onClick={() => saveEditedGoal(goal.id)}>Save</button>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(goal)}>Edit</button>
                        <button onClick={() => deleteGoal(goal.id)}>Delete</button>
                      </>
                    )}
                  </td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No goals found for this microcycle.</p>
        )}
      </Modal>
    </div>
  )
}

export default GoalsCrud

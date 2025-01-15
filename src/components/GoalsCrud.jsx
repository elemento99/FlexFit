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
  const [maxMicrocycle, setMaxMicrocycle] = useState(1)
  const [lastMicrocycle, setLastMicrocycle] = useState(null)
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
          setMaxMicrocycle(1)
          setMicrocycle(1)
        } else {
          const allMicrocycles = [...new Set(data.map(item => item.microcycle))]
          const newMaxMicrocycle = allMicrocycles.length > 0 ? allMicrocycles[0] : 1

          if (maxMicrocycle < newMaxMicrocycle) {
            setMicrocycles(allMicrocycles)
            setMaxMicrocycle(newMaxMicrocycle)
            setMicrocycle(newMaxMicrocycle)
          }
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
    }
  }, [user, microcycle])

  useEffect(() => {
    if (maxMicrocycle !== microcycle) {
      setMicrocycle(maxMicrocycle)
    }
  }, [maxMicrocycle])

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
    if (!lastMicrocycle || lastMicrocycle.length === 0) {
      console.error("No goals found in the last microcycle.")
      return
    }

    try {
      const newMicrocycle = maxMicrocycle + 1

      const newGoals = lastMicrocycle.map(({ id, ...goalWithoutId }) => ({
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
      setMaxMicrocycle(newMicrocycle)
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

  const useFetchMicrocycles = (user, maxMicrocycle, setMicrocycles, setMaxMicrocycle, setMicrocycle) => {
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
            setMaxMicrocycle(1)
            setMicrocycle(1)
          } else {
            const allMicrocycles = [...new Set(data.map(item => item.microcycle))]
            const newMaxMicrocycle = allMicrocycles.length > 0 ? allMicrocycles[0] : 1

            if (maxMicrocycle < newMaxMicrocycle) {
              setMicrocycles(allMicrocycles)
              setMaxMicrocycle(newMaxMicrocycle)
              setMicrocycle(newMaxMicrocycle)
            }
          }
        }
      }
      if (user) fetchMicrocycles()
    }, [user, maxMicrocycle, setMicrocycles, setMaxMicrocycle, setMicrocycle])
  }

  const useFetchGoals = (microcycle, user, setGoals, setLoading) => {
    useEffect(() => {
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
      if (user && microcycle) fetchGoals()
    }, [microcycle, user, setGoals, setLoading])
  }

  const useUpdateMicrocycle = (maxMicrocycle, setMicrocycle) => {
    useEffect(() => {
      if (maxMicrocycle !== microcycle) {
        setMicrocycle(maxMicrocycle)
      }
    }, [maxMicrocycle, setMicrocycle])
  }

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
        setMaxMicrocycle(1)
        setMicrocycle(1)
      } else {
        const allMicrocycles = [...new Set(data.map(item => item.microcycle))]
        const newMaxMicrocycle = allMicrocycles.length > 0 ? allMicrocycles[0] : 1

        if (maxMicrocycle < newMaxMicrocycle) {
          setMicrocycles(allMicrocycles)
          setMaxMicrocycle(newMaxMicrocycle)
          setMicrocycle(newMaxMicrocycle)
        }
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
    }
  return (
    <div>
      <button
        onClick={() => {
          setModalIsOpen(true)
          fetchMicrocycles()
          fetchGoals()
          setMicrocycle(maxMicrocycle)
        }}
      >
        Open Goals Modal
      </button>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Goals Modal"
      >
        <h2>Goals</h2>
        {loading && <p>Loading...</p>}
        {!loading && goals.length === 0 && <p>No goals found</p>}
        <button onClick={() => createNextMicrocycle()}>Next Microcycle</button>
        <div>
          <form>
            <input
              type="text"
              placeholder="Exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
            />
            <input
              type="number"
              placeholder="Sets"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <textarea
              placeholder="Categories"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
            <button type="button" onClick={() => createGoal()}>Add Goal</button>
          </form>
        </div>
        <ul>
          {goals.map(goal => (
            <li key={goal.id}>
              <div>
                {editingGoalId === goal.id ? (
                  <div>
                    <input
                      type="text"
                      value={editedGoal.Exercise || goal.Exercise}
                      onChange={(e) => handleEditChange(e, "Exercise", goal.id)}
                    />
                    <input
                      type="number"
                      value={editedGoal.Sets || goal.Sets}
                      onChange={(e) => handleEditChange(e, "Sets", goal.id)}
                    />
                    <input
                      type="number"
                      value={editedGoal.Reps || goal.Reps}
                      onChange={(e) => handleEditChange(e, "Reps", goal.id)}
                    />
                    <textarea
                      value={editedGoal.categories || goal.categories}
                      onChange={(e) => handleEditChange(e, "categories", goal.id)}
                    />
                    <button onClick={() => saveEditedGoal(goal.id)}>Save</button>
                    <button onClick={() => setEditingGoalId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <span>{goal.Exercise}</span>
                    <span>{goal.Sets}</span>
                    <span>{goal.Reps}</span>
                    <span>{goal.categories}</span>
                    <button onClick={() => handleEdit(goal)}>Edit</button>
                    <button onClick={() => deleteGoal(goal.id)}>Delete</button>
                    <button
                      onClick={() => toggleActive(goal.id, goal.active)}
                    >
                      {goal.active === 1 ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

export default GoalsCrud

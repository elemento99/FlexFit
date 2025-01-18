import React, { useState, useEffect } from 'react'
import supabase from '../assets/supabase/client'
import { useAuth } from '../contexts/userAuth'

const DoneSetsTable = () => {
    const [doneSets, setDoneSets] = useState([])
    const [goals, setGoals] = useState([])
    const [showTable, setShowTable] = useState(false)
    const [failCounts, setFailCounts] = useState({})
    const [selectedMicrocycle, setSelectedMicrocycle] = useState(null)
    const [microcycles, setMicrocycles] = useState([]) 
    
    const { user } = useAuth()

    const fetchDoneSets = async (microcycle = null) => {
        if (!user) {
            console.error('No user is logged in')
            return
        }

        try {
           
            setDoneSets([])

            const { data, error } = await supabase
                .from('done')
                .select('id, created_at, goals_id, reps, fail, goals_microcycle, user_id')
                .eq('user_id', user.id) 

            if (error) {
                console.error('Error fetching done sets:', error)
                return
            }

            console.log('Fetched done sets:', data)

            const groupedSets = data.reduce((acc, set) => {
                const { goals_id, fail, goals_microcycle } = set
                if (!acc[goals_id]) {
                    acc[goals_id] = { sets: [], failCount: 0, microcycles: new Set() }
                }
                acc[goals_id].sets.push(set)
                acc[goals_id].microcycles.add(goals_microcycle)
                if (fail) {
                    acc[goals_id].failCount += 1
                }
                return acc
            }, {})

            
            if (microcycle) {
                Object.keys(groupedSets).forEach((key) => {
                    groupedSets[key].sets = groupedSets[key].sets.filter(
                        (set) => set.goals_microcycle === microcycle
                    )
                })
            }

            setFailCounts(
                Object.keys(groupedSets).reduce((acc, key) => {
                    acc[key] = groupedSets[key].failCount
                    return acc
                }, {})
            )

            setDoneSets(Object.values(groupedSets))

           
            const allMicrocycles = [
                ...new Set(data.map((set) => set.goals_microcycle))
            ]
            setMicrocycles(allMicrocycles)

           
            if (!microcycle && allMicrocycles.length > 0) {
                const maxMicrocycle = Math.max(...allMicrocycles)
                setSelectedMicrocycle(maxMicrocycle)
            }
        } catch (error) {
            console.error('Unexpected error fetching done sets:', error)
        }
    }

    const fetchGoals = async () => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('id, Exercise')

            if (error) {
                console.error('Error fetching goals:', error)
                return
            }

            console.log('Fetched goals:', data)
            setGoals(data)
        } catch (error) {
            console.error('Unexpected error fetching goals:', error)
        }
    }

    useEffect(() => {
        fetchGoals()
    }, [])

    useEffect(() => {
        fetchDoneSets(selectedMicrocycle)
    }, [selectedMicrocycle])

 
    const getExerciseName = (goals_id) => {
        const goal = goals.find((goal) => goal.id === goals_id)
        return goal ? goal.Exercise : 'Desconocido'
    }

    const toggleTable = () => {
        setShowTable((prev) => {
            const newShowTable = !prev
            if (newShowTable) fetchDoneSets(selectedMicrocycle)
            return newShowTable
        })
    }

    const handleMicrocycleChange = (event) => {
        setSelectedMicrocycle(Number(event.target.value))
    }

    return (
        <div>
            <button
                onClick={toggleTable}
                className="btn btn-primary mb-3"
            >
                {showTable ? 'Hide TABLE' : 'Show Done Exercises'}
            </button>

            {showTable && (
                <div>
                    {/* Selector de microciclo */}
                    <select
                        className="form-select mb-3"
                        value={selectedMicrocycle}
                        onChange={handleMicrocycleChange}
                    >
                        {microcycles.map((microcycle, index) => (
                            <option key={index} value={microcycle}>
                                Microciclo {microcycle}
                            </option>
                        ))}
                    </select>

                    <table className="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Ejercicio</th>
                                <th>Repeticiones</th>
                                <th>Fallos</th>
                                <th>Total Sets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doneSets.map((group, index) => (
                                group.sets.length > 0 && (
                                    <tr key={index}>
                                        <td>{getExerciseName(group.sets[0].goals_id)}</td>
                                        <td>
                                            {group.sets.map((set) => set.reps).join(', ')}
                                        </td>
                                        <td>{failCounts[group.sets[0].goals_id]}</td>
                                        <td>{group.sets.length}</td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default DoneSetsTable

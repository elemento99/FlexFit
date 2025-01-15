import React, { createContext, useState, useEffect, useContext } from "react";
import supabase from "../assets/supabase/client";
import { AuthContext } from "../contexts/userAuth";


export const GoalsContext = createContext();


export const GoalsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [microcycle, setMicrocycle] = useState(1);
  const [microcycles, setMicrocycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastMicrocycle, setLastMicrocycle] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMicrocycles();
      fetchGoals();
    }
  }, [user, microcycle]);

  const fetchMicrocycles = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("microcycle")
      .eq("user_id", user.id)
      .order("microcycle", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching microcycles:", error);
    } else {
      const maxMicrocycle = data.length > 0 ? data[0].microcycle : 1;
      setMicrocycles(Array.from({ length: maxMicrocycle }, (_, i) => i + 1));
      fetchLastMicrocycle(maxMicrocycle);
    }
  };

  const fetchLastMicrocycle = async (maxMicrocycle) => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("microcycle", maxMicrocycle);

    if (error) {
      console.error("Error fetching last microcycle data:", error);
    } else {
      setLastMicrocycle(data);
    }
  };

  
  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("microcycle", microcycle);

    if (error) {
      console.error("Error fetching goals:", error);
    } else {
      setGoals(data);
    }
    setLoading(false);
  };


  const createGoal = async (exercise, sets, reps) => {
    if (!exercise) return alert("Exercise field cannot be empty.");

    const { data, error } = await supabase
      .from("goals")
      .insert([
        {
          Exercise: exercise,
          Sets: sets || 1,
          Reps: reps || 1,
          user_id: user.id,
          microcycle: microcycle,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating goal:", error);
    } else {
      setGoals([...goals, data[0]]);
    }
  };


  const createNextMicrocycle = async () => {
    if (!lastMicrocycle || lastMicrocycle.length === 0) return;

    const newMicrocycle = microcycle + 1;

    const { data: lastGoals, error: fetchError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("microcycle", microcycle)
      .order("id", { ascending: true });

    if (fetchError) {
      console.error("Error fetching last microcycle goals:", fetchError);
      return;
    }

    if (!lastGoals || lastGoals.length === 0) {
      console.error("No goals found for the current microcycle.");
      return;
    }

    const newGoals = lastGoals.map((goal) => {
      const { id, ...goalWithoutId } = goal;
      return {
        ...goalWithoutId,
        microcycle: newMicrocycle,
      };
    });

    const { data, error } = await supabase
      .from("goals")
      .insert(newGoals)
      .select();

    if (error) {
      console.error("Error creating next microcycle:", error);
    } else {
      setGoals((prevGoals) => [...prevGoals, ...data]);
      setMicrocycle(newMicrocycle);
    }
  };


  const toggleActive = async (id, currentActiveState) => {
    const newActiveState = currentActiveState === 1 ? 0 : 1;

    const { data, error } = await supabase
      .from("goals")
      .update({ active: newActiveState })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating active state:", error);
    } else {
      setGoals(goals.map((goal) => (goal.id === id ? { ...goal, active: newActiveState } : goal)));
    }
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        loading,
        createGoal,
        createNextMicrocycle,
        toggleActive,
        microcycle,
        microcycles,
        setMicrocycle,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

import React, { useState, useEffect, useContext } from "react";
import supabase from "../assets/supabase/client";
import { AuthContext } from "../contexts/userAuth";
import { Button, Form, Container, Row, Col, Card } from "react-bootstrap";

const DoneExercise = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [reps, setReps] = useState(0);
  const [fail, setFail] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [setsRemaining, setSetsRemaining] = useState(0);

  const fetchGoals = async () => {
    const { data: maxData, error: maxError } = await supabase
      .from("goals")
      .select("microcycle")
      .order("microcycle", { ascending: false })
      .limit(1);

    if (maxError) {
      console.error("Error fetching max microcycle:", maxError);
      return;
    }

    const maxMicrocycle = maxData[0]?.microcycle;

    if (!maxMicrocycle) {
      console.warn("No microcycle data found");
      return;
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("microcycle", maxMicrocycle)
      .eq("active", 1);

    if (error) {
      console.error("Error fetching goals:", error);
    } else {
      const filteredGoals =
        selectedCategory === "All"
          ? data
          : data.filter((goal) => goal.categories && goal.categories.includes(selectedCategory));

      console.log("Filtered goals:", filteredGoals);

      setGoals(filteredGoals);
      if (filteredGoals.length > 0) {
        selectRandomGoal(filteredGoals);
      } else {
        setSelectedGoal(null);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user, selectedCategory]);

  const selectRandomGoal = (activeGoals) => {
    const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
    setSelectedGoal(randomGoal);
    setReps(randomGoal.Reps);
  };

  const handleDone = async () => {
    if (!selectedGoal) return;

    const { error } = await supabase
      .from("done")
      .insert([
        {
          goals_id: selectedGoal.id,
          reps: reps,
          fail: fail,
          goals_microcycle: selectedGoal.microcycle,
          user_id: user.id,
        },
      ]);

    if (error) {
      console.error("Error saving done exercise:", error);
    } else {
      console.log("Exercise marked as done!");
      setReps(selectedGoal.Reps);
      setFail(false);
      selectRandomGoal(goals);
      calculateSetsRemaining();
    }
  };

  const handleNext = () => {
    if (goals.length > 0) {
      const availableGoals = goals.filter((goal) => goal.id !== selectedGoal.id);

      if (availableGoals.length > 0) {
        const randomGoal = availableGoals[Math.floor(Math.random() * availableGoals.length)];
        setSelectedGoal(randomGoal);
        setReps(randomGoal.Reps);
      } else {
        console.log("No more exercises to select");
      }
    }
  };

  const handlePause = async () => {
    if (!selectedGoal) return;

    const { error } = await supabase
      .from("goals")
      .update({ active: 0 })
      .eq("id", selectedGoal.id);

    if (error) {
      console.error("Error pausing goal:", error);
    } else {
      console.log("Goal paused!");
      await fetchGoals();
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("categories");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    const allCategories = data
      .map((goal) => goal.categories)
      .flat()
      .filter((value, index, self) => self.indexOf(value) === index);

    setCategories(["All", ...allCategories]);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const calculateSetsRemaining = async () => {
    if (!selectedGoal) return;

    const { data: doneData, error: doneError } = await supabase
      .from("done")
      .select("goals_id")
      .eq("user_id", user.id)
      .eq("goals_microcycle", selectedGoal.microcycle);

    if (doneError) {
      console.error("Error fetching done exercises:", doneError);
      return;
    }

    console.log("Done exercises:", doneData);

    const totalSets = goals
      .filter((goal) => goal.microcycle === selectedGoal.microcycle && goal.id === selectedGoal.id)
      .map((goal) => ({
        id: goal.id,
        exercise: goal.Exercise,
        sets: goal.Sets,
      }));

    console.log("Total sets for selected goal:", totalSets);

    const doneSets = doneData.map((done) => done.goals_id);

    console.log("Done sets:", doneSets);

    const setsRemainingCount = Math.max(
      totalSets[0]?.sets - doneSets.filter((id) => id === totalSets[0]?.id).length,
      0
    );

    console.log(`Sets remaining for ${selectedGoal.Exercise}:`, setsRemainingCount);

    setSetsRemaining(setsRemainingCount);
  };

  useEffect(() => {
    if (selectedGoal) {
      calculateSetsRemaining();
    }
  }, [selectedGoal]);

  return (
    <Container className="mt-4">
      {/* Selector de categorías */}
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <Form.Label>Category</Form.Label>
          <Form.Control
            as="select"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </Form.Control>
        </Col>
      </Row>
      {selectedGoal ? (
        <Card>
          <Card.Body>
            <Card.Title>Exercise: {selectedGoal.Exercise}</Card.Title>
            <Row className="mb-3">
              <Col xs={12} md={6}>
                <Form.Label>Reps:</Form.Label>
                <Form.Control
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                  id="reps-input"
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} md={6}>
                <Form.Check
                  type="checkbox"
                  label="Fail"
                  checked={fail}
                  onChange={() => setFail(!fail)}
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} md={6}>
                <p><strong>Sets Remaining:</strong> {setsRemaining}</p>
              </Col>
            </Row>
            <Row className="d-flex justify-content-between">
              <Col xs={4}>
                <Button variant="primary" block onClick={handleDone}>Done</Button>
              </Col>
              <Col xs={4}>
                <Button variant="secondary" block onClick={handleNext}>Next</Button>
              </Col>
              <Col xs={4}>
                <Button variant="danger" block onClick={handlePause}>Pause</Button>
              </Col>
            </Row>

          </Card.Body>
        </Card>
      ) : (
        <p>No active goals available. Please check your goals list.</p>
      )}
    </Container>
  );
};

export default DoneExercise;

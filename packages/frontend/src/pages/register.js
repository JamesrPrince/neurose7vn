import React, { useState } from "react";
import { Link } from "gatsby";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const RegisterContainer = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0051cc;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-top: 1rem;
  text-align: center;
`;

const SkillsContainer = styled.div`
  margin-top: 1rem;
  display: ${(props) => (props.show ? "block" : "none")};
`;

const SkillChip = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  margin: 0.25rem;
  background-color: #e9ecef;
  border-radius: 16px;
  font-size: 0.875rem;

  button {
    margin-left: 0.5rem;
    border: none;
    background: none;
    color: #dc3545;
    cursor: pointer;
  }
`;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "client",
    bio: "",
    skills: [],
  });
  const [currentSkill, setCurrentSkill] = useState("");
  const { register, loading, error } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkillAdd = (e) => {
    e.preventDefault();
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()],
      }));
      setCurrentSkill("");
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return; // Password mismatch is handled by backend validation
    }
    try {
      await register(formData);
    } catch (err) {
      // Error is handled in AuthContext
    }
  };

  return (
    <Layout>
      <RegisterContainer>
        <h1>Register</h1>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <Select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="client">Client</option>
            <option value="service_provider">Service Provider</option>
          </Select>
          <textarea
            name="bio"
            placeholder="Bio (optional)"
            value={formData.bio}
            onChange={handleChange}
            rows="4"
            style={{
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />

          <SkillsContainer show={formData.role === "service_provider"}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add a skill"
              />
              <Button type="button" onClick={handleSkillAdd}>
                Add
              </Button>
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              {formData.skills.map((skill) => (
                <SkillChip key={skill}>
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleSkillRemove(skill)}
                  >
                    ×
                  </button>
                </SkillChip>
              ))}
            </div>
          </SkillsContainer>

          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </RegisterContainer>
    </Layout>
  );
};

export default RegisterPage;

import React, { useState } from "react";
import styled from "@emotion/styled";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 150px;
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
`;

const SkillsContainer = styled.div`
  margin-top: 1rem;
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

const FileInput = styled.div`
  input[type="file"] {
    display: none;
  }

  label {
    display: inline-block;
    padding: 0.75rem;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e9ecef;
    }
  }
`;

const AttachmentPreview = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .attachment {
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    button {
      border: none;
      background: none;
      color: #dc3545;
      cursor: pointer;
    }
  }
`;

const ProjectForm = ({
  initialData,
  onSubmit,
  submitLabel = "Create Project",
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    budgetMinimum: initialData?.budgetMinimum || "",
    budgetMaximum: initialData?.budgetMaximum || "",
    deadline: initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : "",
    category: initialData?.category || "web_development",
    skills: initialData?.skills || [],
  });
  const [currentSkill, setCurrentSkill] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleFileRemove = (fileToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== fileToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formPayload = new FormData();

      // Append project data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "skills") {
          formPayload.append(key, JSON.stringify(value));
        } else {
          formPayload.append(key, value);
        }
      });

      // Append files
      files.forEach((file) => {
        formPayload.append("attachments", file);
      });

      await onSubmit(formPayload);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while saving the project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        name="title"
        placeholder="Project Title"
        value={formData.title}
        onChange={handleChange}
        required
      />

      <TextArea
        name="description"
        placeholder="Project Description"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <div style={{ display: "flex", gap: "1rem" }}>
        <Input
          type="number"
          name="budgetMinimum"
          placeholder="Minimum Budget"
          value={formData.budgetMinimum}
          onChange={handleChange}
          required
        />
        <Input
          type="number"
          name="budgetMaximum"
          placeholder="Maximum Budget"
          value={formData.budgetMaximum}
          onChange={handleChange}
          required
        />
      </div>

      <Input
        type="date"
        name="deadline"
        value={formData.deadline}
        onChange={handleChange}
        required
      />

      <Select
        name="category"
        value={formData.category}
        onChange={handleChange}
        required
      >
        <option value="web_development">Web Development</option>
        <option value="mobile_app">Mobile App Development</option>
        <option value="design">Design</option>
        <option value="marketing">Marketing</option>
        <option value="data_science">Data Science</option>
        <option value="game_development">Game Development</option>
        <option value="devops">DevOps</option>
        <option value="other">Other</option>
      </Select>

      <SkillsContainer>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Input
            type="text"
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            placeholder="Required Skills"
          />
          <Button type="button" onClick={handleSkillAdd}>
            Add Skill
          </Button>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          {formData.skills.map((skill) => (
            <SkillChip key={skill}>
              {skill}
              <button type="button" onClick={() => handleSkillRemove(skill)}>
                ×
              </button>
            </SkillChip>
          ))}
        </div>
      </SkillsContainer>

      <FileInput>
        <label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          Upload Attachments
        </label>
      </FileInput>

      {files.length > 0 && (
        <AttachmentPreview>
          {files.map((file, index) => (
            <div key={index} className="attachment">
              <span>{file.name}</span>
              <button type="button" onClick={() => handleFileRemove(index)}>
                ×
              </button>
            </div>
          ))}
        </AttachmentPreview>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Form>
  );
};

export default ProjectForm;

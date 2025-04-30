import React, { useState, useEffect } from "react";
import { navigate } from "gatsby";
import styled from "@emotion/styled";
import axios from "axios";
import Layout from "../../components/Layout";
import ProjectForm from "../../components/ProjectForm";
import { useAuth } from "../../context/AuthContext";

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background-color: ${(props) => (props.active ? "#0070f3" : "#f8f9fa")};
  color: ${(props) => (props.active ? "white" : "black")};
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.active ? "#0051cc" : "#e9ecef")};
  }
`;

const ProjectCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  h3 {
    margin: 0 0 1rem;
  }

  .meta {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
    color: #666;
    font-size: 0.9rem;
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .skill {
    background-color: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 16px;
    font-size: 0.875rem;
  }

  .actions {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: ${(props) =>
    props.variant === "outline" ? "transparent" : "#0070f3"};
  color: ${(props) => (props.variant === "outline" ? "#0070f3" : "white")};
  border: ${(props) =>
    props.variant === "outline" ? "1px solid #0070f3" : "none"};

  &:hover {
    background-color: ${(props) =>
      props.variant === "outline" ? "#e8f2ff" : "#0051cc"};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.GATSBY_API_URL}/api/projects`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProjects(response.data.data.projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${process.env.GATSBY_API_URL}/api/projects`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setActiveTab("projects");
      fetchProjects();
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.GATSBY_API_URL}/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project");
    }
  };

  if (!user || user.role !== "client") {
    if (typeof window !== "undefined") {
      navigate("/login");
    }
    return null;
  }

  return (
    <Layout>
      <DashboardContainer>
        <h1>Client Dashboard</h1>

        <Tabs>
          <Tab
            active={activeTab === "projects"}
            onClick={() => setActiveTab("projects")}
          >
            My Projects
          </Tab>
          <Tab active={activeTab === "new"} onClick={() => setActiveTab("new")}>
            Create New Project
          </Tab>
        </Tabs>

        {activeTab === "new" ? (
          <ProjectForm onSubmit={handleCreateProject} />
        ) : (
          <div>
            {loading ? (
              <p>Loading projects...</p>
            ) : error ? (
              <p style={{ color: "#dc3545" }}>{error}</p>
            ) : projects.length === 0 ? (
              <p>No projects yet. Create your first project!</p>
            ) : (
              projects.map((project) => (
                <ProjectCard key={project.id}>
                  <h3>{project.title}</h3>
                  <div className="meta">
                    <span>
                      Budget: ${project.budgetMinimum} - $
                      {project.budgetMaximum}
                    </span>
                    <span>Status: {project.status}</span>
                    <span>
                      Deadline:{" "}
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{project.description}</p>
                  <div className="skills">
                    {project.skills.map((skill) => (
                      <span key={skill} className="skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="actions">
                    <Button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      variant="outline"
                    >
                      View Details
                    </Button>
                    {project.status === "open" && (
                      <Button
                        onClick={() => handleDeleteProject(project.id)}
                        style={{ backgroundColor: "#dc3545" }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </ProjectCard>
              ))
            )}
          </div>
        )}
      </DashboardContainer>
    </Layout>
  );
};

export default ClientDashboard;

import React, { useState, useEffect } from "react";
import { navigate } from "gatsby";
import styled from "@emotion/styled";
import axios from "axios";
import Layout from "../../components/Layout";
import MessagingInterface from "../../components/MessagingInterface";
import { useAuth } from "../../context/AuthContext";

const ProjectDetailContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProjectInfo = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  h1 {
    margin: 0 0 1rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin-bottom: 1rem;
    color: #666;
  }

  .description {
    margin: 1.5rem 0;
    white-space: pre-wrap;
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

  .attachments {
    margin-top: 1.5rem;

    h3 {
      margin-bottom: 0.5rem;
    }

    .files {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .file {
      padding: 0.5rem 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      font-size: 0.875rem;
      text-decoration: none;
      color: #0070f3;

      &:hover {
        background-color: #e9ecef;
      }
    }
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background-color: ${(props) => {
    if (props.variant === "outline") return "transparent";
    if (props.variant === "danger") return "#dc3545";
    return "#0070f3";
  }};
  color: ${(props) => (props.variant === "outline" ? "#0070f3" : "white")};
  border: ${(props) =>
    props.variant === "outline" ? "1px solid #0070f3" : "none"};

  &:hover {
    background-color: ${(props) => {
      if (props.variant === "outline") return "#e8f2ff";
      if (props.variant === "danger") return "#c82333";
      return "#0051cc";
    }};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const MessagingSection = styled.div`
  margin-top: 2rem;
`;

const ProjectDetailPage = ({ params }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const projectId = params.id;

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.GATSBY_API_URL}/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProject(response.data.data.project);
      setError(null);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.GATSBY_API_URL}/api/projects/${projectId}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProject();
    } catch (err) {
      console.error("Error applying to project:", err);
      alert("Failed to apply to project");
    }
  };

  const handleAssign = async (providerId) => {
    if (!window.confirm("Are you sure you want to assign this project?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.GATSBY_API_URL}/api/projects/${projectId}/assign/${providerId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProject();
    } catch (err) {
      console.error("Error assigning project:", err);
      alert("Failed to assign project");
    }
  };

  const handleComplete = async () => {
    if (
      !window.confirm("Are you sure you want to mark this project as complete?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.GATSBY_API_URL}/api/projects/${projectId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProject();
    } catch (err) {
      console.error("Error completing project:", err);
      alert("Failed to complete project");
    }
  };

  if (loading) {
    return (
      <Layout>
        <ProjectDetailContainer>
          <p>Loading project details...</p>
        </ProjectDetailContainer>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <ProjectDetailContainer>
          <p style={{ color: "#dc3545" }}>{error || "Project not found"}</p>
        </ProjectDetailContainer>
      </Layout>
    );
  }

  const canApply =
    user.role === "service_provider" &&
    project.status === "open" &&
    project.clientId !== user.id;

  const canAssign =
    user.role === "client" &&
    project.clientId === user.id &&
    project.status === "open";

  const canComplete =
    user.role === "client" &&
    project.clientId === user.id &&
    project.status === "in_progress";

  const isInvolved =
    project.clientId === user.id || project.assignedToId === user.id;

  return (
    <Layout>
      <ProjectDetailContainer>
        <ProjectInfo>
          <h1>{project.title}</h1>

          <div className="meta">
            <span>
              Budget: ${project.budgetMinimum} - ${project.budgetMaximum}
            </span>
            <span>Status: {project.status}</span>
            <span>
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </span>
          </div>

          <div className="description">{project.description}</div>

          <div className="skills">
            {project.skills.map((skill) => (
              <span key={skill} className="skill">
                {skill}
              </span>
            ))}
          </div>

          {project.attachments?.length > 0 && (
            <div className="attachments">
              <h3>Attachments</h3>
              <div className="files">
                {project.attachments.map((filename) => (
                  <a
                    key={filename}
                    href={`${process.env.GATSBY_API_URL}/uploads/${filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file"
                  >
                    {filename.split("-").slice(1).join("-")}
                  </a>
                ))}
              </div>
            </div>
          )}
        </ProjectInfo>

        <ActionBar>
          {canApply && <Button onClick={handleApply}>Apply for Project</Button>}

          {canAssign && (
            <Button onClick={() => handleAssign(project.applicants[0]?.id)}>
              Assign Project
            </Button>
          )}

          {canComplete && (
            <Button onClick={handleComplete}>Mark as Complete</Button>
          )}
        </ActionBar>

        {isInvolved && project.status !== "open" && (
          <MessagingSection>
            <h2>Messages</h2>
            <MessagingInterface
              projectId={project.id}
              otherUserId={
                user.id === project.clientId
                  ? project.assignedToId
                  : project.clientId
              }
              otherUserName={
                user.id === project.clientId
                  ? project.assignedTo?.username
                  : project.client?.username
              }
            />
          </MessagingSection>
        )}
      </ProjectDetailContainer>
    </Layout>
  );
};

export default ProjectDetailPage;

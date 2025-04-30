import React, { useState, useEffect } from "react";
import { navigate } from "gatsby";
import styled from "@emotion/styled";
import axios from "axios";
import Layout from "../../components/Layout";
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

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ProjectCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  h3 {
    margin: 0 0 1rem;
    color: #0070f3;
    cursor: pointer;
  }

  .meta {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1rem;
  }

  .description {
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .skill {
    background-color: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 16px;
    font-size: 0.75rem;
  }

  .status {
    margin-top: 1rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    background-color: ${(props) => {
      switch (props.status) {
        case "in_progress":
          return "#cff4fc";
        case "completed":
          return "#d1e7dd";
        default:
          return "#e9ecef";
      }
    }};
    color: ${(props) => {
      switch (props.status) {
        case "in_progress":
          return "#055160";
        case "completed":
          return "#0f5132";
        default:
          return "#212529";
      }
    }};
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

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${process.env.GATSBY_API_URL}/api/projects`;

      if (activeTab === "my_projects") {
        url += "?assigned=true";
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data.data.projects);
      setError(null);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.GATSBY_API_URL}/api/projects/${projectId}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProjects();
    } catch (err) {
      console.error("Error applying to project:", err);
      alert("Failed to apply to project");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchTerm === "" ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.skills.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      categoryFilter === "" || project.category === categoryFilter;

    if (activeTab === "available") {
      return matchesSearch && matchesCategory && project.status === "open";
    }

    return matchesSearch && matchesCategory && project.assignedToId === user.id;
  });

  if (!user || user.role !== "service_provider") {
    if (typeof window !== "undefined") {
      navigate("/login");
    }
    return null;
  }

  return (
    <Layout>
      <DashboardContainer>
        <h1>Service Provider Dashboard</h1>

        <Tabs>
          <Tab
            active={activeTab === "available"}
            onClick={() => setActiveTab("available")}
          >
            Available Projects
          </Tab>
          <Tab
            active={activeTab === "my_projects"}
            onClick={() => setActiveTab("my_projects")}
          >
            My Projects
          </Tab>
        </Tabs>

        <SearchBar>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="web_development">Web Development</option>
            <option value="mobile_app">Mobile App Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="data_science">Data Science</option>
            <option value="game_development">Game Development</option>
            <option value="devops">DevOps</option>
            <option value="other">Other</option>
          </select>
        </SearchBar>

        {loading ? (
          <p>Loading projects...</p>
        ) : error ? (
          <p style={{ color: "#dc3545" }}>{error}</p>
        ) : filteredProjects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          <ProjectGrid>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} status={project.status}>
                <h3 onClick={() => navigate(`/projects/${project.id}`)}>
                  {project.title}
                </h3>
                <div className="meta">
                  Budget: ${project.budgetMinimum} - ${project.budgetMaximum}
                </div>
                <div className="description">{project.description}</div>
                <div className="skills">
                  {project.skills.map((skill) => (
                    <span key={skill} className="skill">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="status">
                  {project.status.replace("_", " ").toUpperCase()}
                </div>
                {project.status === "open" && (
                  <Button
                    onClick={() => handleApply(project.id)}
                    style={{ marginTop: "1rem" }}
                  >
                    Apply
                  </Button>
                )}
                {project.status !== "open" && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{ marginTop: "1rem" }}
                  >
                    View Details
                  </Button>
                )}
              </ProjectCard>
            ))}
          </ProjectGrid>
        )}
      </DashboardContainer>
    </Layout>
  );
};

export default ProviderDashboard;

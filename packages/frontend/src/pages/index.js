import React from "react";
import { navigate } from "gatsby";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const Hero = styled.section`
  background: linear-gradient(135deg, #0070f3 0%, #00a6ed 100%);
  color: white;
  padding: 4rem 0;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;

  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.primary
      ? `
    background-color: white;
    color: #0070f3;
    border: none;

    &:hover {
      background-color: #f0f0f0;
    }
  `
      : `
    background-color: transparent;
    color: white;
    border: 2px solid white;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `}
`;

const Features = styled.section`
  padding: 4rem 0;
  background-color: white;
`;

const FeaturesGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const FeatureCard = styled.div`
  padding: 2rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  h3 {
    color: #0070f3;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
  }
`;

const HowItWorks = styled.section`
  padding: 4rem 0;
  background-color: #f8f9fa;
`;

const Steps = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  h2 {
    text-align: center;
    margin-bottom: 3rem;
  }
`;

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const Step = styled.div`
  text-align: center;

  .number {
    width: 40px;
    height: 40px;
    background-color: #0070f3;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-weight: bold;
  }

  h3 {
    margin-bottom: 1rem;
  }

  p {
    color: #666;
  }
`;

const IndexPage = () => {
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate(
        user.role === "client" ? "/dashboard/client" : "/dashboard/provider"
      );
    } else {
      navigate("/register");
    }
  };

  return (
    <Layout>
      <Hero>
        <HeroContent>
          <h1>Connect with Top Tech Talent</h1>
          <p>
            Find the perfect developer for your project or discover exciting
            opportunities as a freelancer.
          </p>
          <ButtonGroup>
            <Button primary onClick={handleGetStarted}>
              Get Started
            </Button>
            <Button onClick={() => navigate("/projects")}>
              Browse Projects
            </Button>
          </ButtonGroup>
        </HeroContent>
      </Hero>

      <Features>
        <FeaturesGrid>
          <FeatureCard>
            <h3>Skilled Developers</h3>
            <p>
              Access a network of experienced developers with diverse skill sets
              and expertise in various technologies.
            </p>
          </FeatureCard>
          <FeatureCard>
            <h3>Secure Payments</h3>
            <p>
              Our escrow system ensures secure transactions and protects both
              clients and developers throughout the project.
            </p>
          </FeatureCard>
          <FeatureCard>
            <h3>Real-time Communication</h3>
            <p>
              Stay connected with built-in messaging and collaboration tools to
              ensure smooth project execution.
            </p>
          </FeatureCard>
        </FeaturesGrid>
      </Features>

      <HowItWorks>
        <Steps>
          <h2>How It Works</h2>
          <StepGrid>
            <Step>
              <div className="number">1</div>
              <h3>Post a Project</h3>
              <p>
                Describe your project requirements, set your budget, and specify
                the skills needed.
              </p>
            </Step>
            <Step>
              <div className="number">2</div>
              <h3>Review Proposals</h3>
              <p>
                Receive proposals from qualified developers and choose the best
                match for your project.
              </p>
            </Step>
            <Step>
              <div className="number">3</div>
              <h3>Collaborate</h3>
              <p>
                Work together using our platform's tools to achieve your project
                goals effectively.
              </p>
            </Step>
            <Step>
              <div className="number">4</div>
              <h3>Complete & Review</h3>
              <p>
                Finalize the project, release payment, and share your experience
                through reviews.
              </p>
            </Step>
          </StepGrid>
        </Steps>
      </HowItWorks>
    </Layout>
  );
};

export default IndexPage;

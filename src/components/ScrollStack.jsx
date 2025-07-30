import React from 'react';
import ProjectsScrollStack from './ProjectsScrollStack';

export const ScrollStackItem = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

const ScrollStack = ({ children, ...props }) => {
  const projects = React.Children.map(children, (child, index) => {
    // Extract project data from the nested structure
    const projectTile = child.props?.children;
    const entityCard = projectTile?.props?.children;
    const cardLink = entityCard?.props?.children;
    
    if (!cardLink) return null;
    
    const cardHeader = cardLink.props?.children?.[0];
    const tagList = cardLink.props?.children?.[1];
    
    if (!cardHeader || !tagList) return null;
    
    const title = cardHeader.props?.children?.[0]?.props?.children;
    const description = cardHeader.props?.children?.[1]?.props?.children;
    const techStack = tagList.props?.children?.map(tag => tag?.props?.children) || [];
    const onClickHandler = cardLink.props?.onClick;
    
    // Extract route from onClick handler
    let route = null;
    if (onClickHandler && onClickHandler.toString().includes('navigate')) {
      const match = onClickHandler.toString().match(/"([^"]+)"/);
      route = match ? match[1] : null;
    }
    
    return {
      id: index,
      title: title || `Project ${index + 1}`,
      description: description || '',
      techStack: techStack,
      route: route,
    };
  }) || [];

  return (
    <ProjectsScrollStack {...props} projects={projects}>
      {children}
    </ProjectsScrollStack>
  );
};

export default ScrollStack;
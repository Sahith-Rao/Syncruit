import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PostJob = () => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: [''],
    questions: [{
      question: '',
      category: 'technical',
      timeLimit: 180
    }]
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { token } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequirementChange = (index, value) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        category: 'technical',
        timeLimit: 180
      }]
    }));
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await axios.post('http://localhost:5000/api/jobs', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess(true);
      setFormData({
        title: '',
        company: '',
        description: '',
        requirements: [''],
        questions: [{
          question: '',
          category: 'technical',
          timeLimit: 180
        }]
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error posting job');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Post New Job Opening
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Job posted successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Job Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              required
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Requirements
            </Typography>
            <List>
              {formData.requirements.map((req, index) => (
                <ListItem key={index}>
                  <TextField
                    fullWidth
                    value={req}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    required
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeRequirement(index)}
                      disabled={formData.requirements.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Button onClick={addRequirement} sx={{ mb: 3 }}>
              Add Requirement
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Interview Questions
            </Typography>
            {formData.questions.map((q, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Question"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={q.category}
                  onChange={(e) => handleQuestionChange(index, 'category', e.target.value)}
                  margin="normal"
                  SelectProps={{
                    native: true
                  }}
                >
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="problem-solving">Problem Solving</option>
                </TextField>
                <TextField
                  fullWidth
                  label="Time Limit (seconds)"
                  type="number"
                  value={q.timeLimit}
                  onChange={(e) => handleQuestionChange(index, 'timeLimit', parseInt(e.target.value))}
                  margin="normal"
                  required
                />
                <Button
                  onClick={() => removeQuestion(index)}
                  disabled={formData.questions.length === 1}
                  sx={{ mt: 1 }}
                >
                  Remove Question
                </Button>
              </Paper>
            ))}
            <Button onClick={addQuestion} sx={{ mb: 3 }}>
              Add Question
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
            >
              Post Job
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default PostJob; 
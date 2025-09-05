// src/components/TaskList.tsx
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { Card, ListGroup, Form, Button, InputGroup, Spinner, Alert } from 'react-bootstrap';
import type { User } from '@supabase/supabase-js';

interface Task {
  id: number;
  task_text: string;
  is_completed: boolean;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchTasks(user.id);
      } else {
        setLoading(false);
      }
    };
    fetchUserAndTasks();
  }, []);

  const fetchTasks = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      setError('Não foi possível carregar as tarefas.');
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !user) return;

    const { data, error } = await supabase
      .from('tarefas')
      .insert({ task_text: newTaskText, user_id: user.id })
      .select();

    if (error) {
      setError('Não foi possível adicionar a tarefa.');
    } else if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskText('');
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    const { error } = await supabase
      .from('tarefas')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id);
    
    if(error) {
        setError("Erro ao atualizar tarefa.");
    } else {
        fetchTasks(user.id);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
     if (!user || !window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
     const { error } = await supabase.from('tarefas').delete().eq('id', taskId);

     if(error) {
         setError("Erro ao excluir tarefa.");
     } else {
        fetchTasks(user.id);
     }
  }

  return (
    <Card>
      <Card.Header as="h5"><i className="bi bi-check2-square me-2"></i>Lista de Tarefas</Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleAddTask}>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Ex: Abastecer o veículo..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
            />
            <Button type="submit" variant="primary"><i className="bi bi-plus-lg"></i></Button>
          </InputGroup>
        </Form>
        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : (
          <ListGroup>
            {tasks.map(task => (
              <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center">
                <Form.Check
                  type="checkbox"
                  id={`task-${task.id}`}
                  label={task.task_text}
                  checked={task.is_completed}
                  onChange={() => handleToggleTask(task)}
                  className={task.is_completed ? 'text-muted text-decoration-line-through' : ''}
                />
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTask(task.id)}>
                  <i className="bi bi-trash"></i>
                </Button>
              </ListGroup.Item>
            ))}
             {tasks.length === 0 && <p className="text-muted text-center mt-3">Nenhuma tarefa ainda.</p>}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Settings = () => {
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // i didnt implement functionality yet
      setSuccess('Password updated successfully');
      setError('');
    } catch (err) {
      setError('Failed to update password. Please try again.');
      setSuccess('');
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // here also
      setSuccess('Email updated successfully');
      setError('');
    } catch (err) {
      setError('Failed to update email. Please try again.');
      setSuccess('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {success && (
        <Alert className="bg-green-50 text-green-600 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <Input
              type="email"
              placeholder="New Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit">Update Email</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { addTestData, getTestData, TestData } from '../services/firestoreTest.service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function FirestoreTestScreen() {
  const [testData, setTestData] = useState<TestData[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      console.log('FirestoreTestScreen: Fetching data...');
      const data = await getTestData();
      console.log('FirestoreTestScreen: Data fetched:', data);
      setTestData(data);
    } catch (err) {
      console.error('FirestoreTestScreen: Error fetching data:', err);
      setError(`Failed to fetch data from Firestore: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    console.log('FirestoreTestScreen: Component mounted, fetching data...');
    fetchData();
  }, []);

  const handleAddData = async () => {
    if (!title || !amount) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('FirestoreTestScreen: Adding data:', { title, amount, type });
      const docId = await addTestData(title, parseFloat(amount), type);
      console.log('FirestoreTestScreen: Data added successfully, doc ID:', docId);

      // Refresh data
      await fetchData();

      // Reset form
      setTitle('');
      setAmount('');
      setType('income');

      console.log('FirestoreTestScreen: Form reset and data refreshed');
    } catch (err) {
      console.error('FirestoreTestScreen: Error adding data:', err);
      setError(`Failed to add data to Firestore: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  console.log('FirestoreTestScreen: Rendering with testData:', testData.length, 'items');

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-black">Firestore Test Screen</h1>
      <p className="text-gray-600">Component loaded successfully - {testData.length} items loaded</p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddData} disabled={loading}>
            {loading ? 'Adding...' : 'Add Data'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Data List ({testData.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {testData.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <ul className="space-y-2">
              {testData.map((item) => (
                <li key={item.id} className="p-3 border rounded bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-lg">{item.title}</strong>
                      <p className="text-sm text-gray-600">
                        Amount: {item.amount} | Type: {item.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {item.id}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {item.createdAt?.toDate()?.toLocaleString() || 'No date'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Tasknova Home</h1>
        <Button onClick={handleProfileClick}>Profile</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <img src="/placeholder.svg" alt={`Placeholder ${i + 1}`} className="rounded-t-lg" />
              <CardTitle>Card Title {i + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                This is a description for card {i + 1}. You can put more detailed information here.
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HomePage; 
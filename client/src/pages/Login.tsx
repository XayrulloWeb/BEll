import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, School, User, Lock, Building } from 'lucide-react';

export function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        schoolId: 'school_test_001', // По умолчанию тестовая школа
        role: 'admin' as 'admin' | 'superadmin'
    });

    const { login, register, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        const success = isLogin 
            ? await login(formData.username, formData.password)
            : await register(formData.username, formData.password, formData.schoolId, formData.role);

        if (!success) {
            console.error('Authentication failed');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) clearError();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <School className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Система Управления Звонками</CardTitle>
                    <CardDescription>
                        {isLogin ? 'Войдите в систему' : 'Создайте новый аккаунт'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Вход</TabsTrigger>
                            <TabsTrigger value="register">Регистрация</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="login">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-username">Имя пользователя</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="login-username"
                                            type="text"
                                            placeholder="Введите имя пользователя"
                                            value={formData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Пароль</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="Введите пароль"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Вход в систему...
                                        </>
                                    ) : (
                                        'Войти'
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                        
                        <TabsContent value="register">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-username">Имя пользователя</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="register-username"
                                            type="text"
                                            placeholder="Введите имя пользователя"
                                            value={formData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Пароль</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="register-password"
                                            type="password"
                                            placeholder="Введите пароль"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="register-school">ID Школы</Label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="register-school"
                                            type="text"
                                            placeholder="school_test_001"
                                            value={formData.schoolId}
                                            onChange={(e) => handleInputChange('schoolId', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="register-role">Роль</Label>
                                    <select
                                        id="register-role"
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="admin">Администратор школы</option>
                                        <option value="superadmin">Супер-администратор</option>
                                    </select>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Создание аккаунта...
                                        </>
                                    ) : (
                                        'Зарегистрироваться'
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>Тестовые данные для входа:</p>
                        <p><strong>Логин:</strong> admin</p>
                        <p><strong>Пароль:</strong> admin123</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

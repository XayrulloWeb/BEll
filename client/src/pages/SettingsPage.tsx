import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import useStore from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Компонент для смены пароля
const ChangePasswordCard = () => {
    const { changePassword, isLoading } = useAuthStore();
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("Новые пароли не совпадают.");
            return;
        }
        const success = await changePassword(passwords.oldPassword, passwords.newPassword);
        if (success) {
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Смена пароля</CardTitle><CardDescription>Введите ваш текущий и новый пароль.</CardDescription></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="oldPassword">Текущий пароль</Label><Input id="oldPassword" name="oldPassword" type="password" value={passwords.oldPassword} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="newPassword">Новый пароль</Label><Input id="newPassword" name="newPassword" type="password" value={passwords.newPassword} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="confirmPassword">Подтвердите новый пароль</Label><Input id="confirmPassword" name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handleChange} required /></div>
                    <Button type="submit" disabled={isLoading}>{isLoading ? "Сохранение..." : "Сохранить новый пароль"}</Button>
                </form>
            </CardContent>
        </Card>
    );
};

// Компонент для настроек школы
const SchoolSettingsCard = () => {
    const { user } = useAuthStore();
    const { updateSchoolName } = useStore();
    
    const [schoolName, setSchoolName] = useState(user?.schoolName || '');

    useEffect(() => {
        if (user?.schoolName && user.schoolName !== schoolName) {
            setSchoolName(user.schoolName);
        }
    }, [user?.schoolName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (schoolName.trim()) {
            updateSchoolName(schoolName.trim());
        } else {
            toast.error("Название школы не может быть пустым.");
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Настройки школы</CardTitle>
                <CardDescription>Изменение основной информации о вашем учебном заведении.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">Название школы</Label>
                        <Input id="schoolName" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                    </div>
                    <Button type="submit">Сохранить название</Button>
                </form>
            </CardContent>
        </Card>
    );
}

// Главный компонент страницы
export function SettingsPage() {
    const { user } = useAuthStore();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChangePasswordCard />
                {user?.role === 'admin' && <SchoolSettingsCard />}
            </div>
        </motion.div>
    );
}
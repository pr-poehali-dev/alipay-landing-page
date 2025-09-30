import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";
import { useState } from "react";

const PAYMENT_API = 'https://functions.poehali.dev/ec7f246f-bf58-462e-8773-a897e33098cd';

const Index = () => {
  const [amount, setAmount] = useState('1000');

  const handlePaymentClick = async () => {
    const sessionId = localStorage.getItem('chat_session_id') || 
      'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chat_session_id', sessionId);

    try {
      await fetch(PAYMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({ amount: parseFloat(amount) || 1000 })
      });

      const chatWidget = document.querySelector('[data-chat-widget]');
      if (chatWidget) {
        (chatWidget as HTMLButtonElement).click();
      }
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="CreditCard" size={24} className="text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">AliPay 金服</h1>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs sm:text-sm">
            <Icon name="Shield" size={14} className="mr-1" />
            <span className="hidden sm:inline">Безопасно</span>
            <Icon name="Shield" size={14} className="sm:hidden" />
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <Badge className="mb-4 sm:mb-6 bg-blue-100 text-blue-800 text-xs sm:text-sm">
                <Icon name="Zap" size={14} className="mr-1" />
                Мгновенное пополнение
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Пополните <span className="text-primary">AliPay</span> быстро и безопасно
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">Надёжный сервис пополнения китайских кошельков с гарантией возврата средств и круглосуточной поддержкой.
Окажем помощь в пополнении.</p>
              
              <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={20} className="text-green-600" />
                  <span className="text-sm sm:text-base text-gray-700">5 минут</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Shield" size={20} className="text-green-600" />
                  <span className="text-sm sm:text-base text-gray-700">100% гарантия</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Headphones" size={20} className="text-green-600" />
                  <span className="text-sm sm:text-base text-gray-700">24/7 поддержка</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-center">Пополнить кошелёк</CardTitle>
                <p className="text-gray-600 text-center">Введите данные для пополнения</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Сумма пополнения</label>
                  <div className="relative">
                    <Input 
                      placeholder="1000" 
                      className="h-12 pr-16" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₽</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Минимум: 500₽</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>К пополнению:</span>
                    <span className="font-semibold">{amount || 1000} ₽</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Комиссия:</span>
                    <span className="text-green-600">0 ₽</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center font-bold">
                    <span>Итого:</span>
                    <span>{amount || 1000} ₽</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 text-lg" 
                    size="lg"
                    onClick={handlePaymentClick}
                  >
                    <Icon name="ArrowRight" size={20} className="mr-2" />
                    Пополнить сейчас
                  </Button>
                  
                  <Link to="/reviews">
                    <Button variant="outline" className="w-full h-10 text-sm">
                      <Icon name="Star" size={16} className="mr-2" />
                      Посмотреть отзывы
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4 border-t">
                  <Icon name="Lock" size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Защищено SSL шифрованием</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Icon name="Shield" size={24} className="text-primary sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Безопасность</h3>
              <p className="text-sm sm:text-base text-gray-600">Все транзакции защищены банковским уровнем шифрования</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Icon name="Zap" size={24} className="text-secondary sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Скорость</h3>
              <p className="text-sm sm:text-base text-gray-600">Средства поступают на счёт в течение 5 минут</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Icon name="Headphones" size={24} className="text-purple-600 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Поддержка</h3>
              <p className="text-sm sm:text-base text-gray-600">Работаем круглосуточно без выходных и праздников</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Отзывы клиентов</h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                name: "Александр К.",
                rating: 5,
                text: "Пополнял уже несколько раз. Всё быстро и без проблем. Рекомендую!",
                date: "2 дня назад"
              },
              {
                name: "Мария С.",
                rating: 5,
                text: "Отличный сервис! Деньги поступили за 3 минуты, поддержка очень вежливая.",
                date: "5 дней назад"
              },
              {
                name: "Дмитрий В.",
                rating: 5,
                text: "Пользуюсь уже полгода. Никаких нареканий, всё работает как часы.",
                date: "1 неделя назад"
              }
            ].map((review, i) => (
              <Card key={i} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <Icon key={j} name="Star" size={16} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{review.text}"</p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{review.name}</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Наши гарантии</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="text-center p-3 sm:p-4 lg:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <Icon name="RotateCcw" size={20} className="text-green-600" />
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Возврат средств</h4>
              <p className="text-xs sm:text-sm text-gray-600">100% возврат если средства не поступили</p>
            </Card>
            
            <Card className="text-center p-3 sm:p-4 lg:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <Icon name="FileText" size={20} className="text-blue-600" />
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Официально</h4>
              <p className="text-xs sm:text-sm text-gray-600">Зарегистрированная компания с лицензией</p>
            </Card>
            
            <Card className="text-center p-3 sm:p-4 lg:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <Icon name="Clock" size={20} className="text-purple-600" />
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Быстро</h4>
              <p className="text-xs sm:text-sm text-gray-600">Максимум 10 минут на обработку</p>
            </Card>
            
            <Card className="text-center p-3 sm:p-4 lg:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <Icon name="MessageCircle" size={20} className="text-red-600" />
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Поддержка</h4>
              <p className="text-xs sm:text-sm text-gray-600">Оперативная помощь 24/7</p>
            </Card>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="CreditCard" size={14} className="text-white sm:w-4 sm:h-4" />
              </div>
              <span className="text-white font-semibold text-sm sm:text-base">AliPay Service</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400 text-center">
              <span>© 2024 AliPay Service</span>
              <span className="hidden sm:inline">Политика конфиденциальности</span>
              <span className="hidden sm:inline">Условия использования</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
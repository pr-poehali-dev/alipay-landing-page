import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="CreditCard" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AliPay 金服</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Icon name="Shield" size={16} className="mr-1" />
              Безопасно
            </Badge>
            <Button variant="outline">Поддержка</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-blue-100 text-blue-800">
                <Icon name="Zap" size={16} className="mr-1" />
                Мгновенное пополнение
              </Badge>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Пополните <span className="text-primary">AliPay</span> быстро и безопасно
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Надёжный сервис пополнения китайских кошельков с гарантией возврата средств и круглосуточной поддержкой.
              </p>
              
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={20} className="text-green-600" />
                  <span className="text-gray-700">5 минут</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Shield" size={20} className="text-green-600" />
                  <span className="text-gray-700">100% гарантия</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Headphones" size={20} className="text-green-600" />
                  <span className="text-gray-700">24/7 поддержка</span>
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
                    <Input placeholder="1000" className="h-12 pr-16" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₽</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Минимум: 500₽</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>К пополнению:</span>
                    <span className="font-semibold">1000 ₽</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Комиссия:</span>
                    <span className="text-green-600">0 ₽</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center font-bold">
                    <span>Итого:</span>
                    <span>1000 ₽</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-lg" size="lg">
                  <Icon name="ArrowRight" size={20} className="mr-2" />
                  Пополнить сейчас
                </Button>

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
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Shield" size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Безопасность</h3>
              <p className="text-gray-600">Все транзакции защищены банковским уровнем шифрования</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Zap" size={32} className="text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Скорость</h3>
              <p className="text-gray-600">Средства поступают на счёт в течение 5 минут</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Headphones" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Поддержка</h3>
              <p className="text-gray-600">Работаем круглосуточно без выходных и праздников</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Отзывы клиентов</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Наши гарантии</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="RotateCcw" size={24} className="text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Возврат средств</h4>
              <p className="text-sm text-gray-600">100% возврат если средства не поступили</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="FileText" size={24} className="text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Официально</h4>
              <p className="text-sm text-gray-600">Зарегистрированная компания с лицензией</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="Clock" size={24} className="text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Быстро</h4>
              <p className="text-sm text-gray-600">Максимум 10 минут на обработку</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="MessageCircle" size={24} className="text-red-600" />
              </div>
              <h4 className="font-semibold mb-2">Поддержка</h4>
              <p className="text-sm text-gray-600">Оперативная помощь 24/7</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Остались вопросы?</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Наша команда поддержки готова помочь вам 24/7. Свяжитесь с нами любым удобным способом.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Icon name="MessageCircle" size={20} className="text-primary" />
                  <span>Telegram: @alipay_support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Mail" size={20} className="text-primary" />
                  <span>support@alipay-service.ru</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Phone" size={20} className="text-primary" />
                  <span>+7 (800) 123-45-67</span>
                </div>
              </div>
            </div>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Написать нам</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Ваше имя" className="bg-gray-700 border-gray-600 text-white" />
                <Input placeholder="Email" className="bg-gray-700 border-gray-600 text-white" />
                <textarea 
                  placeholder="Ваш вопрос..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none"
                  rows={4}
                />
                <Button className="w-full">
                  <Icon name="Send" size={16} className="mr-2" />
                  Отправить
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="CreditCard" size={16} className="text-white" />
              </div>
              <span className="text-white font-semibold">AliPay Service</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>© 2024 AliPay Service</span>
              <span>Политика конфиденциальности</span>
              <span>Условия использования</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
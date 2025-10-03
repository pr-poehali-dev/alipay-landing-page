import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketsFilterProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function TicketsFilter({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm
}: TicketsFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-48 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
          <SelectItem value="all">Все статусы</SelectItem>
          <SelectItem value="новая">Новая</SelectItem>
          <SelectItem value="обработан">Обработан</SelectItem>
          <SelectItem value="скам">Скам</SelectItem>
          <SelectItem value="успешный платеж">Успешный платеж</SelectItem>
          <SelectItem value="в работе спикер">В работе Спикер</SelectItem>
          <SelectItem value="в работе кристи">В работе Кристи</SelectItem>
          <SelectItem value="в работе тичер">В работе Тичер</SelectItem>
          <SelectItem value="в работе жека">В работе Жека</SelectItem>
          <SelectItem value="закрыт">Закрыт</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Поиск по имени, сумме, ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full sm:w-80 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
      />
    </div>
  );
}
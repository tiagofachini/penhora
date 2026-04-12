import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Camera } from 'lucide-react';

const ItemsPage = () => {
  return (
    <>
      <Helmet>
        <title>Itens - Penhora.app.br</title>
        <meta name="description" content="Página de listagem de itens (funcionalidade em desenvolvimento)." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Itens Apreendidos</h1>
            <p className="text-slate-500">Esta página não está mais disponível diretamente via navegação. Os itens são gerenciados dentro dos processos.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listagem de Itens</CardTitle>
            <CardDescription>
              A visualização e gestão de itens ocorre agora dentro de cada processo individual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                <Camera className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-800">Gerenciamento de itens centralizado</h3>
                <p className="mt-1 text-sm text-slate-500">Por favor, acesse os itens através da página de detalhes de cada processo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ItemsPage;
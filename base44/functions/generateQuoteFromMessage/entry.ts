import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = (body && typeof body.message === 'string' ? body.message : '').trim();
    const profession = (body && typeof body.profession === 'string' && body.profession.trim() ? body.profession : 'home services').trim();

    if (!message) return Response.json({ error: 'A customer message is required' }, { status: 400 });

    const prompt =
      `You are an expert estimator for a ${profession} business in Europe. ` +
      `A customer sent the following message asking for a price. Read it carefully and produce a professional quote draft.\n\n` +
      `Customer message:\n"""\n${message}\n"""\n\n` +
      `Your job:\n` +
      `1. Infer a short, clear job title (max 6 words).\n` +
      `2. Break the work into clear, billable line items. For each line item give a description, a quantity (use 1 unless the message implies more, e.g. area in m² or number of fixtures), and a realistic unit price in EUR based on typical European market rates for ${profession} work (materials + labor combined). Use confident, rounded numbers.\n` +
      `3. List any important information missing from the message that should be confirmed before finalizing (concise, max 4 short bullets). If nothing is missing, return an empty array.\n` +
      `4. Write a one-sentence summary of the job.\n\n` +
      `Return JSON matching the schema exactly. Do not include currency symbols.`;

    const schema = {
      type: 'object',
      properties: {
        job_title: { type: 'string' },
        summary: { type: 'string' },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' }
            },
            required: ['description', 'quantity', 'unit_price']
          }
        },
        missing_info: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['job_title', 'summary', 'line_items', 'missing_info']
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      model: 'gpt_5_mini'
    });

    const lineItems = (result && Array.isArray(result.line_items) ? result.line_items : []).map((li) => {
      const quantity = Number(li.quantity) || 1;
      const unitPrice = Number(li.unit_price) || 0;
      return {
        description: String(li.description || ''),
        quantity,
        unit_price: unitPrice,
        total: quantity * unitPrice
      };
    });

    return Response.json({
      job_title: result.job_title || '',
      summary: result.summary || '',
      line_items: lineItems,
      missing_info: Array.isArray(result.missing_info) ? result.missing_info : []
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
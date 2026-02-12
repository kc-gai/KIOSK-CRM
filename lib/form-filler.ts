import { chromium, Browser, Page } from 'playwright'

// フォームフィールドの型
export type FormField = {
  selector: string
  type: string          // text, email, tel, textarea, select, radio, checkbox
  label: string         // ラベルテキスト
  name?: string         // input name属性
  placeholder?: string
  value?: string        // 入力した値
  options?: string[]    // select/radioの選択肢
  required?: boolean
}

// 自社情報テンプレート
export type CompanyTemplate = {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  message: string
}

// フォーム分析結果
export type FormAnalysis = {
  formUrl: string
  formAction?: string
  fields: FormField[]
  hasSubmitButton: boolean
  submitSelector?: string
}

// フォームフィールド → テンプレート値のマッピング
const FIELD_MAPPING: Array<{ patterns: RegExp[]; templateKey: keyof CompanyTemplate }> = [
  {
    patterns: [/会社/i, /企業/i, /法人/i, /団体/i, /company/i, /organization/i],
    templateKey: 'companyName',
  },
  {
    patterns: [/氏名/i, /名前/i, /担当/i, /name/i, /お名前/i, /ご氏名/i],
    templateKey: 'contactPerson',
  },
  {
    patterns: [/メール/i, /email/i, /mail/i, /e-mail/i, /Eメール/i],
    templateKey: 'email',
  },
  {
    patterns: [/電話/i, /tel/i, /phone/i, /連絡先/i],
    templateKey: 'phone',
  },
  {
    patterns: [/内容/i, /メッセージ/i, /問い?合わせ/i, /message/i, /comment/i, /備考/i, /ご用件/i, /ご質問/i],
    templateKey: 'message',
  },
]

// ラベルテキストからテンプレートキーを推論
function inferTemplateKey(label: string, name?: string, placeholder?: string): keyof CompanyTemplate | null {
  const searchText = `${label} ${name || ''} ${placeholder || ''}`

  for (const mapping of FIELD_MAPPING) {
    if (mapping.patterns.some((p) => p.test(searchText))) {
      return mapping.templateKey
    }
  }
  return null
}

// ページ内のフォームを分析
export async function analyzeForm(url: string): Promise<{ analysis: FormAnalysis; browser: Browser; page: Page }> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

  const analysis = await page.evaluate(() => {
    const forms = document.querySelectorAll('form')
    const targetForm = forms.length > 0 ? forms[0] : document.body

    const fields: Array<{
      selector: string
      type: string
      label: string
      name?: string
      placeholder?: string
      options?: string[]
      required?: boolean
    }> = []

    // input, textarea, select要素を探索
    const inputs = targetForm.querySelectorAll('input, textarea, select')

    inputs.forEach((input, index) => {
      const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      const type = el.tagName === 'TEXTAREA' ? 'textarea'
        : el.tagName === 'SELECT' ? 'select'
        : (el as HTMLInputElement).type || 'text'

      // hidden, submit, button はスキップ
      if (['hidden', 'submit', 'button', 'image', 'reset', 'file'].includes(type)) return

      // ラベル取得
      let label = ''
      const labelEl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null
      if (labelEl) {
        label = labelEl.textContent?.trim() || ''
      } else {
        // 親要素からラベルを探す
        const parent = el.closest('label, .form-group, .form-item, tr, .field, [class*="form"]')
        if (parent) {
          const labelChild = parent.querySelector('label, .label, th, dt, [class*="label"]')
          label = labelChild?.textContent?.trim() || ''
        }
      }

      // セレクターを構築
      let selector = ''
      if (el.id) selector = `#${el.id}`
      else if (el.name) selector = `[name="${el.name}"]`
      else selector = `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`

      // selectの選択肢
      let options: string[] | undefined
      if (el.tagName === 'SELECT') {
        options = Array.from((el as HTMLSelectElement).options).map((o) => o.text)
      }

      fields.push({
        selector,
        type,
        label,
        name: el.name || undefined,
        placeholder: (el as HTMLInputElement).placeholder || undefined,
        options,
        required: el.required,
      })
    })

    // 送信ボタン検索
    const submitBtn = targetForm.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type]), .submit-btn, [class*="submit"]'
    )
    const submitSelector = submitBtn
      ? (submitBtn.id ? `#${submitBtn.id}` : 'button[type="submit"], input[type="submit"]')
      : undefined

    return {
      formUrl: window.location.href,
      formAction: forms.length > 0 ? forms[0].action : undefined,
      fields,
      hasSubmitButton: !!submitBtn,
      submitSelector,
    } as FormAnalysis
  })

  return { analysis, browser, page }
}

// フォームに値を入力（送信はしない）
export async function fillForm(
  page: Page,
  fields: FormField[],
  template: CompanyTemplate
): Promise<FormField[]> {
  const filledFields: FormField[] = []

  for (const field of fields) {
    const key = inferTemplateKey(field.label, field.name, field.placeholder)
    if (!key) continue

    const value = template[key]
    if (!value) continue

    try {
      if (field.type === 'textarea') {
        await page.fill(field.selector, value)
      } else if (field.type === 'select') {
        // selectは最も近い選択肢を選ぶ（または最初の空でない選択肢）
        await page.selectOption(field.selector, { index: 1 }).catch(() => {})
      } else if (field.type === 'radio' || field.type === 'checkbox') {
        await page.check(field.selector).catch(() => {})
      } else {
        await page.fill(field.selector, value)
      }

      filledFields.push({ ...field, value })
    } catch {
      // フィールド入力エラーはスキップ
    }
  }

  return filledFields
}

// スクリーンショット撮影
export async function takeScreenshot(page: Page): Promise<Buffer> {
  return page.screenshot({ fullPage: true, type: 'png' })
}

// フォーム分析 + 入力 + スクリーンショットの一連処理
export async function analyzeAndFill(
  url: string,
  template: CompanyTemplate
): Promise<{
  analysis: FormAnalysis
  filledFields: FormField[]
  screenshot: Buffer
}> {
  const { analysis, browser, page } = await analyzeForm(url)

  const filledFields = await fillForm(page, analysis.fields, template)
  const screenshot = await takeScreenshot(page)

  await browser.close()

  return { analysis, filledFields, screenshot }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// デフォルトテンプレート（初期化用）- 実際の営業メール
const DEFAULT_TEMPLATES = [
  {
    contactRound: 1,
    name: '営業メール①（初回ご連絡）',
    subject: '【KAFLIX CLOUD】レンタカー業務効率化のご案内',
    bodyText: `ご担当者様

突然のご連絡失礼いたします。
株式会社KAFLIX CLOUDの大塚と申します。

レンタカー事業者様向けに、
予約・車両・精算業務をまとめて管理できる
クラウドシステムを提供しております。

本日は、営業のご案内というよりも、
「同じような課題をお持ちではないか」と思い
ご連絡させていただきました。

実際に多くのレンタカー会社様から、
次のようなお声をよく伺います。

・Excelや紙での予約・精算管理に限界を感じている
・OTAからの予約を手入力しており、ミスや手間が発生している
・貸渡中・返却予定の車両状況が把握しづらい
・受付が混雑し、スタッフの負担が大きい

もし一つでも「自社も近いかも」と感じられましたら、
弊社のクラウドシステム「REborn」が
お役に立てる可能性がございます。

REbornは、
・OTAの予約情報をシステムに取り込み
・予約・車両・精算情報を一元管理し
・現場の手作業や属人化を減らす
ことを目的とした、レンタカー事業者様向けのシステムです。

また、受付業務の負担軽減として、
セルフチェックイン機との連携も可能です。
混雑時間帯の受付対応や、スタッフ様の負担軽減を
目的に導入されるケースが増えています。

「今すぐ導入を検討している」
という段階でなくても問題ございません。

・自社の運用でも使えるのか
・今のやり方をどう変えられるのか
・まず何から整理すべきか

といった情報交換だけでも大丈夫です。

もし少しでもご興味がありましたら、
本メールへのご返信、もしくは
「資料だけ見たい」「話だけ聞きたい」
と一言お送りいただければ幸いです。

▼製品紹介（参考）
https://www.kaflixcloud.co.jp/products/reborn/

▼無料オンライン相談
https://www.kaflixcloud.co.jp/request/

お忙しいところ恐れ入りますが、
ご確認のほど、何卒よろしくお願いいたします。`,
    bodyHtml: '',
    isActive: true,
  },
  {
    contactRound: 2,
    name: '営業メール②（詳細ご案内）',
    subject: '【KAFLIX CLOUD】レンタカー管理システム「REborn」のご案内',
    bodyText: `ご担当者様

突然のご連絡失礼いたします。KAFLIX CLOUDの大塚と申します。

弊社は、レンタカー事業者様向けに特化した業務効率化システムを開発・提供している会社です。

多くのレンタカー会社様とお話をしていて、こんなお悩みをよく耳にします。

・Excelや紙ベースの予約・精算管理では限界を感じている
・OTAからの予約情報を手入力しており、ミスやタイムロスが生じている
・貸渡しや返却車両の状況がリアルタイムで把握できず、社内共有も煩雑
・受付が混雑しており、スタッフが疲弊している

もし、上記に一つでも当てはまるようでしたら、
弊社のクラウドシステム「REborn」が貴社のお役に立てるかもしれません。

▼詳しい製品紹介ページ
https://www.kaflixcloud.co.jp/products/reborn/

REbornの主な特長：

◆ OTA予約の簡単取り込み
複数の予約サイトからの情報を手入力することなく、簡単に取り込むことが可能です。

◆ 精算業務のシステム化
精算管理も一つのシステムで管理できます。人為的ミスを防ぎ、業務効率を大幅に向上させます。

◆ 空き状況・返却日の可視化
予約チャートでその日の状況を可視化できます。返却予定や貸渡中の車両の動きも一目で把握が可能です。

◆ セルフチェックイン機の連携
受付業務をもっとスムーズにしたいとお考えでしたら、
弊社が提供するセルフチェックイン機との連携がおすすめです。
お客様ご自身でチェックイン手続きを完結できるため、
混雑時でも受付にかかる時間をわずか2分程度まで短縮可能。
非対面での受付対応もできるため、スタッフの負担軽減や外国人観光客への対応にも効果的です。

＼相談・デモ導入受付中！／

まずは簡単なヒアリングを通して、貴社の現状に合った解決策をご提案させていただきます。

▼お問い合わせはこちら
・無料オンライン相談　https://www.kaflixcloud.co.jp/request/
・電話番号　080-9855-7091
・メール　lang@kaflixcloud.co.jp

何卒、よろしくお願いいたします。`,
    bodyHtml: '',
    isActive: true,
  },
  {
    contactRound: 3,
    name: '営業メール③（かんたん紹介）',
    subject: '【KAFLIX CLOUD】レンタカー業務をラクにする仕組みのご紹介',
    bodyText: `ご担当者様

はじめまして。株式会社KAFLIX CLOUD（カフリックスクラウド）の大塚と申します。
レンタカー会社様向けに、業務がぐっとラクになる仕組みをご提案しています。

突然ですが、こんなことでお困りではありませんか？

・OTA予約を手で入力していて、ミスや時間のロスがある
・お客様の受付や精算に時間がかかって、現場がバタバタする
・どの車がいつ戻るのか、空いているのか、すぐに分からない
・人手が足りないけど、なかなか増やせない

もし、どれか1つでも当てはまるなら、
「REborn（リボーン）」というシステムが、きっとお役に立てます。

■「REborn」でできること
・予約サイトからの予約を、自動で取り込み（手入力なし）
・料金の計算や請求もおまかせ（ミスがなくなります）
・車の空き状況や返却予定も、ひと目でわかります

■さらに、「セルフチェックイン機」とつなげれば…
・お客様が自分でチェックインできて、受付の人がいなくてもOK
・受付から出発まで、たった2分で完了
・英語・中国語・韓国語にも対応できるから、外国人対応も安心です

いま、全国のレンタカー会社さんから「もっと早く知りたかった！」という声をたくさんいただいています。

▼詳しい製品紹介ページ
https://www.kaflixcloud.co.jp/products/reborn/

まずは、30分程お時間をいただけませんか？
オンラインで、御社の今のやり方に合ったご提案をさせていただきます。もちろん費用はかかりません。

「話を聞いてみたい」と思ったら、下記からお気軽にお問合せください。
私たちは、御社の"毎日がラクになる仕組みづくり"を全力でお手伝いします。

▼お問い合わせはこちら
・無料オンライン相談　https://www.kaflixcloud.co.jp/request/
・電話番号　080-9855-7091
・メール　lang@kaflixcloud.co.jp`,
    bodyHtml: '',
    isActive: true,
  },
  {
    contactRound: 4,
    name: '4回目フォローアップ',
    subject: '【KAFLIX CLOUD】ご検討状況のお伺い',
    bodyText: `ご担当者様

お世話になっております。
株式会社KAFLIX CLOUDの大塚でございます。

以前ご連絡させていただきました、
レンタカー業務管理システム「REborn」の件で
改めてご案内をお送りしております。

その後、レンタカー業務でお困りのことはございませんか？

・予約管理やOTA対応で手間が増えている
・受付対応の効率をもっと上げたい
・車両の稼働状況を一目で把握したい

このようなお悩みがございましたら、
短時間のオンラインデモで「REborn」の活用イメージを
ご確認いただけます。

「まずは話だけ聞いてみたい」でもまったく問題ございません。

▼無料オンライン相談
https://www.kaflixcloud.co.jp/request/

ご不明な点等ございましたら、お気軽にお問い合わせください。
何卒よろしくお願いいたします。`,
    bodyHtml: '',
    isActive: true,
  },
  {
    contactRound: 5,
    name: '5回目以降（定期連絡）',
    subject: '【KAFLIX CLOUD】レンタカー業務効率化の最新情報',
    bodyText: `ご担当者様

お世話になっております。
株式会社KAFLIX CLOUDの大塚でございます。

定期的なご連絡として、弊社の最新情報をお届けいたします。

レンタカー業界では、DX化やインバウンド需要への対応が
ますます重要になってきております。

弊社のクラウドシステム「REborn」は、
予約・車両・精算の一元管理に加え、
セルフチェックイン機による多言語受付対応も
ご好評いただいております。

ご興味をお持ちいただけましたら、
いつでもお気軽にご連絡ください。

▼製品紹介
https://www.kaflixcloud.co.jp/products/reborn/

▼無料オンライン相談
https://www.kaflixcloud.co.jp/request/

今後ともどうぞよろしくお願いいたします。`,
    bodyHtml: '',
    isActive: true,
  },
]

// GET - テンプレート一覧取得（なければ初期化）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const init = searchParams.get('init') === 'true'

    let templates = await prisma.emailTemplate.findMany({
      orderBy: { contactRound: 'asc' },
    })

    // テンプレートがない場合、または初期化リクエストの場合
    if (templates.length === 0 || init) {
      // 既存テンプレートを削除（初期化時のみ）
      if (init && templates.length > 0) {
        await prisma.emailTemplate.deleteMany()
      }

      // デフォルトテンプレートを作成
      for (const tpl of DEFAULT_TEMPLATES) {
        await prisma.emailTemplate.upsert({
          where: { contactRound: tpl.contactRound },
          update: {},
          create: tpl,
        })
      }

      templates = await prisma.emailTemplate.findMany({
        orderBy: { contactRound: 'asc' },
      })
    }

    return NextResponse.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Templates API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - テンプレート作成/更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, contactRound, subject, bodyHtml, bodyText, isActive } = body

    if (!name || !contactRound || !subject || !bodyText) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, contactRound, subject, bodyText' },
        { status: 400 }
      )
    }

    if (contactRound < 1 || contactRound > 5) {
      return NextResponse.json(
        { success: false, error: 'contactRound must be between 1 and 5' },
        { status: 400 }
      )
    }

    let template

    if (id) {
      // 更新
      template = await prisma.emailTemplate.update({
        where: { id },
        data: {
          name,
          contactRound,
          subject,
          bodyHtml,
          bodyText,
          isActive: isActive !== undefined ? isActive : true,
        },
      })
    } else {
      // 作成（upsert: contactRound重複時は更新）
      template = await prisma.emailTemplate.upsert({
        where: { contactRound },
        update: {
          name,
          subject,
          bodyHtml,
          bodyText,
          isActive: isActive !== undefined ? isActive : true,
        },
        create: {
          name,
          contactRound,
          subject,
          bodyHtml,
          bodyText,
          isActive: isActive !== undefined ? isActive : true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Templates API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - テンプレート削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    await prisma.emailTemplate.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Template deleted',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email Templates API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
